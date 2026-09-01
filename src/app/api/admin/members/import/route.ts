import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { generateCode } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH = 400; // batas satu batch Firestore adalah 500

type Baris = Record<string, string>;

const teks = (v: unknown) => String(v ?? "").trim();

/**
 * Impor massal data member dari CSV.
 * Dipanggil per potongan (chunk) oleh halaman admin supaya 400+ baris
 * tidak menabrak batas waktu satu permintaan.
 */
export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const rows: Baris[] = Array.isArray(body.rows) ? body.rows : [];
    if (rows.length === 0) throw new HttpError(400, "Tidak ada baris untuk diimpor.");
    if (rows.length > BATCH) {
      throw new HttpError(400, `Maksimal ${BATCH} baris per kiriman.`);
    }

    const db = adminDb();

    // Ambil sekali saja: nomor & kode yang sudah terpakai, untuk cek duplikat.
    const semua = await db.collection("members").select("phone", "code").get();
    const nomorAda = new Set<string>();
    const kodeAda = new Set<string>();
    semua.docs.forEach((d) => {
      const p = teks(d.get("phone")).replace(/\D/g, "");
      if (p) nomorAda.add(p);
      const c = teks(d.get("code"));
      if (c) kodeAda.add(c);
    });

    const now = new Date().toISOString();
    const batch = db.batch();

    let masuk = 0;
    const dilewati: string[] = [];

    for (const r of rows) {
      const name = teks(r.name);
      if (name.length < 2) {
        dilewati.push(`${name || "(tanpa nama)"} — nama kosong`);
        continue;
      }

      const phoneRaw = teks(r.phone);
      const phoneDigits = phoneRaw.replace(/\D/g, "");
      if (phoneDigits && nomorAda.has(phoneDigits)) {
        dilewati.push(`${name} — nomor sudah terdaftar`);
        continue;
      }
      if (phoneDigits) nomorAda.add(phoneDigits);

      let code = generateCode();
      while (kodeAda.has(code)) code = generateCode();
      kodeAda.add(code);

      const hadir = Number(teks(r.attendanceCount)) || 0;
      const statusRaw = teks(r.status).toLowerCase();
      const status =
        statusRaw.startsWith("member") || statusRaw.startsWith("anggota") || hadir > 0
          ? "member"
          : "calon";

      batch.set(db.collection("members").doc(), {
        code,
        name,
        phone: phoneRaw,
        nickname: teks(r.nickname),
        age: teks(r.age),
        gender: teks(r.gender),
        religion: teks(r.religion),
        address: teks(r.address),
        job: teks(r.job),
        maritalStatus: teks(r.maritalStatus),
        canSwim: teks(r.canSwim),
        waterTrauma: teks(r.waterTrauma),
        healthNotes: teks(r.healthNotes),
        isSwimCoach: teks(r.isSwimCoach),
        knowFrom: teks(r.knowFrom),
        reason: teks(r.reason),
        birthPlace: teks(r.birthPlace),
        birthDate: teks(r.birthDate),
        district: teks(r.district),
        city: teks(r.city),
        province: teks(r.province),
        note: teks(r.note),
        status,
        attendanceCount: hadir,
        firstAttendedAt: null,
        lastAttendedAt: null,
        pusatOpenedAt: null,
        createdAt: teks(r.createdAt) || now,
        source: "import",
      });
      masuk++;
    }

    if (masuk > 0) await batch.commit();

    return Response.json({ masuk, dilewati });
  } catch (err) {
    return errorResponse(err);
  }
}
