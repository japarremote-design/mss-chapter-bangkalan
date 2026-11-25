import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { sessionFromDoc, weekFromDoc } from "@/lib/data";
import { linkToken } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const snap = await adminDb()
      .collection("weeks")
      .orderBy("startDate", "desc")
      .limit(20)
      .get();

    const weeks = await Promise.all(
      snap.docs.map(async (doc) => {
        const week = weekFromDoc(doc);
        const sessions = await adminDb()
          .collection("sessions")
          .where("weekId", "==", week.id)
          .get();
        return {
          ...week,
          token: linkToken(week.id),
          sessions: sessions.docs.map(sessionFromDoc).filter((s) => !s.deletedAt).sort((a, b) => a.date.localeCompare(b.date)),
        };
      })
    );

    return Response.json({ weeks });
  } catch (err) {
    return errorResponse(err);
  }
}

type Row = {
  title?: string;
  date?: string;
  startTime?: string;
  location?: string;
  quota?: number;
  coach?: string;
  fee?: string;
};

function normalisasi(v: string) {
  return v.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Buat satu paket jadwal mingguan sekaligus beberapa sesi di dalamnya. */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const rows: Row[] = Array.isArray(body.sessions) ? body.sessions : [];

    const valid = rows.filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(String(r.date ?? "")));
    if (valid.length === 0) throw new HttpError(400, "Isi minimal satu sesi dengan tanggal valid.");

    const dates = valid.map((r) => String(r.date)).sort();
    const now = new Date().toISOString();

    const db = adminDb();
    const weekRef = db.collection("weeks").doc();
    const week = {
      label: String(body.label ?? "").trim() || `Jadwal ${dates[0]} s/d ${dates[dates.length - 1]}`,
      startDate: dates[0],
      endDate: dates[dates.length - 1],
      open: true,
      createdAt: now,
      createdBy: admin.email,
      sessionCount: valid.length,
    };

    // Sesi yang sudah ada di tanggal-tanggal ini — untuk mendeteksi slot kembar.
    // Query "in" dibatasi 30 nilai, jadi tanggalnya dipecah per 30.
    const unik = [...new Set(dates)];
    const potongan: string[][] = [];
    for (let i = 0; i < unik.length; i += 30) potongan.push(unik.slice(i, i + 30));
    const hasilQuery = await Promise.all(
      potongan.map((p) => db.collection("sessions").where("date", "in", p).get())
    );
    const existing = hasilQuery.flatMap((q) => q.docs).filter((d) => !d.get("deletedAt"));

    const batch = db.batch();
    batch.set(weekRef, week);

    let dibuat = 0;
    const digabung: string[] = [];
    // Slot yang dibuat di permintaan ini — supaya dua baris dengan slot sama
    // di satu form juga digabung, bukan jadi dua sesi terpisah.
    const baru: { kunci: string; ref: FirebaseFirestore.DocumentReference; coaches: string[] }[] = [];

    for (const row of valid) {
      const date = String(row.date);
      const startTime = String(row.startTime ?? "").trim();
      const location = String(row.location ?? "").trim();
      const coach = String(row.coach ?? "").trim();
      const fee = String(row.fee ?? "").trim();
      // "Andri + Maria" → dua nama
      const coachList = coach
        .split(/\s*\+\s*/)
        .map((c) => c.trim())
        .filter(Boolean);

      // Hari, jam, dan kolam yang sama = satu latihan dengan beberapa relawan pelatih.
      const kunci = `${date}|${normalisasi(startTime)}|${normalisasi(location)}`;
      const label = `${date}${startTime ? ` ${startTime}` : ""}${location ? ` di ${location}` : ""}`;

      // (a) kembar dengan baris lain di form yang sama
      const kembarBaru = baru.find((b) => b.kunci === kunci);
      if (kembarBaru) {
        for (const c of coachList) {
          if (!kembarBaru.coaches.some((x) => normalisasi(x) === normalisasi(c))) {
            kembarBaru.coaches.push(c);
          }
        }
        batch.update(kembarBaru.ref, { coaches: kembarBaru.coaches });
        digabung.push(label);
        continue;
      }

      // (b) kembar dengan sesi yang sudah tersimpan sebelumnya
      const kembar = existing.find((d) => {
        const v = d.data();
        return (
          v.date === date &&
          normalisasi(String(v.startTime ?? "")) === normalisasi(startTime) &&
          normalisasi(String(v.location ?? "")) === normalisasi(location)
        );
      });

      if (kembar) {
        const sebelumnya: string[] = Array.isArray(kembar.data().coaches)
          ? kembar.data().coaches
          : [];
        const gabungan = [...sebelumnya];
        for (const c of coachList) {
          if (!gabungan.some((x) => normalisasi(x) === normalisasi(c))) gabungan.push(c);
        }
        // Sesi lama ikut dipindah ke paket jadwal yang baru dishare, supaya
        // link minggu ini memuat semua latihan — RSVP yang sudah ada tetap aman.
        batch.update(kembar.ref, { coaches: gabungan, weekId: weekRef.id });
        baru.push({ kunci, ref: kembar.ref, coaches: gabungan });
        digabung.push(label);
        dibuat++;
        continue;
      }

      const ref = db.collection("sessions").doc();
      baru.push({ kunci, ref, coaches: [...coachList] });
      batch.set(ref, {
        title: String(row.title ?? "").trim() || "Latihan Rutin",
        date,
        startTime,
        location,
        coaches: coachList,
        fee,
        quota: Number.isFinite(Number(row.quota)) ? Math.max(0, Number(row.quota)) : 0,
        open: true,
        attendeeCount: 0,
        rsvpCount: 0,
        weekId: weekRef.id,
        createdAt: now,
        createdBy: admin.email,
      });
      dibuat++;
    }

    if (dibuat === 0) throw new HttpError(400, "Tidak ada sesi yang bisa dibuat.");

    batch.update(weekRef, { sessionCount: dibuat });
    await batch.commit();

    return Response.json(
      {
        week: { id: weekRef.id, ...week, sessionCount: dibuat, token: linkToken(weekRef.id) },
        digabung,
      },
      { status: 201 }
    );
  } catch (err) {
    return errorResponse(err);
  }
}
