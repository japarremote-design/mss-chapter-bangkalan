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
          sessions: sessions.docs.map(sessionFromDoc).sort((a, b) => a.date.localeCompare(b.date)),
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
    const existing = await db.collection("sessions").where("date", "in", [...new Set(dates)].slice(0, 10)).get();

    const batch = db.batch();
    batch.set(weekRef, week);

    let dibuat = 0;
    const digabung: string[] = [];

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
      const kembar = existing.docs.find((d) => {
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
        if (gabungan.length !== sebelumnya.length) {
          batch.update(kembar.ref, { coaches: gabungan });
        }
        digabung.push(`${date}${startTime ? ` ${startTime}` : ""}${location ? ` di ${location}` : ""}`);
        continue;
      }

      const ref = db.collection("sessions").doc();
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

    if (dibuat === 0) {
      // Semua baris ternyata kembar — tidak perlu paket jadwal baru.
      throw new HttpError(
        409,
        `Semua sesi sudah ada di jadwal lain (${digabung.join(", ")}). Nama relawan pelatih tidak jadi ditambahkan; buka sesi yang sudah ada untuk mengubahnya.`
      );
    }

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
