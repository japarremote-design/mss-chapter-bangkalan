import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError } from "@/lib/auth";
import { createUniqueCode, resetIndeksNama } from "@/lib/data";
import { preflight, withCors } from "@/lib/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return preflight(req);
}

const teks = (v: unknown) => String(v ?? "").trim();

/**
 * Pendataan ulang MEMBER LAMA — bukan pendaftaran calon member baru.
 *
 * Dipakai sekali saat database direset karena pengurus sebelumnya belum
 * sepakat memakai aplikasi ini; sekarang mereka sudah sepakat, jadi member
 * yang sudah lama ikut MSS perlu didata ulang dari nol. Bedanya dengan
 * /api/public/daftar:
 * - langsung berstatus "member" (bukan "calon")
 * - langsung "disetujui" — tidak masuk antrean verifikasi pengurus, karena
 *   orangnya sudah dikenal & sudah lama ikut latihan, bukan pendaftar baru
 * - dianggap sudah di grup WhatsApp Member (grupMemberDikirimAt langsung
 *   terisi), supaya tidak membanjiri dasbor dengan notifikasi "konfirmasi
 *   grup" untuk orang yang sebenarnya sudah lama di grup itu
 *
 * Link halaman ini sengaja tidak dipasang di beranda — hanya dibagikan
 * manual oleh pengurus ke member lama lewat WhatsApp, supaya calon member
 * baru tidak memakainya untuk melewati proses verifikasi.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = teks(body.name);
    const phone = teks(body.phone);
    if (name.length < 2) throw new HttpError(400, "Nama lengkap wajib diisi.");
    for (const [k, label] of [["birthPlace", "Tempat lahir"], ["birthDate", "Tanggal lahir"], ["district", "Kecamatan"], ["city", "Kabupaten/Kota"], ["province", "Provinsi"]] as const) {
      if (!teks(body[k])) throw new HttpError(400, `${label} wajib diisi.`);
    }
    if (phone.replace(/\D/g, "").length < 8) throw new HttpError(400, "Nomor WhatsApp wajib diisi.");

    const db = adminDb();
    const dup = await db.collection("members").where("phone", "==", phone).limit(1).get();
    if (!dup.empty) {
      throw new HttpError(
        409,
        "Nomor ini sudah terdata. Hubungi pengurus kalau datanya perlu dikoreksi."
      );
    }

    const code = await createUniqueCode();
    const now = new Date().toISOString();
    await db.collection("members").add({
      code,
      name,
      phone,
      nickname: teks(body.nickname),
      age: teks(body.age),
      gender: teks(body.gender),
      religion: teks(body.religion),
      address: teks(body.address),
      job: teks(body.job),
      maritalStatus: teks(body.maritalStatus),
      canSwim: teks(body.canSwim),
      waterTrauma: teks(body.waterTrauma),
      healthNotes: teks(body.healthNotes),
      isSwimCoach: teks(body.isSwimCoach),
      knowFrom: teks(body.knowFrom),
      reason: teks(body.reason),
      birthPlace: teks(body.birthPlace),
      birthDate: teks(body.birthDate),
      district: teks(body.district),
      city: teks(body.city),
      province: teks(body.province),
      note: "",
      status: "member",
      verifikasi: "disetujui",
      verifikasiAt: now,
      verifikasiBy: "pendataan-ulang",
      verifikasiCatatan: "Member lama, pendataan ulang pasca reset database — tidak melalui alur verifikasi calon member.",
      grupMemberDikirimAt: now,
      grupMemberDikirimBy: "pendataan-ulang",
      attendanceCount: 0,
      firstAttendedAt: null,
      lastAttendedAt: null,
      createdAt: now,
      source: "web-pendataan-member",
    });

    resetIndeksNama();

    return withCors(
      req,
      Response.json(
        {
          ok: true,
          success: true,
          code,
          message: "Barakallah! Data kamu sebagai member MSS sudah tersimpan.",
        },
        { status: 201 }
      )
    );
  } catch (err) {
    const res = errorResponse(err);
    const data = { error: "" };
    try {
      Object.assign(data, await res.clone().json());
    } catch {}
    return withCors(
      req,
      Response.json(
        { success: false, error: data.error, message: data.error },
        { status: res.status }
      )
    );
  }
}
