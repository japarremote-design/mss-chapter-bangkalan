import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError } from "@/lib/auth";
import { createUniqueCodePelatih } from "@/lib/data";
import { preflight, withCors } from "@/lib/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return preflight(req);
}

const teks = (v: unknown) => String(v ?? "").trim();

/**
 * Pendataan Relawan Pelatih (RP). Daftar RP terpisah dari member; langsung
 * tercatat sebagai RP (tanpa antrean persetujuan). Syaratnya sudah ikut TFT.
 * Link halamannya tidak dipasang di beranda — dibagikan manual ke calon RP.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = teks(body.name);
    const phone = teks(body.phone);
    if (name.length < 2) throw new HttpError(400, "Nama lengkap wajib diisi.");
    for (const [k, label] of [
      ["birthPlace", "Tempat lahir"],
      ["birthDate", "Tanggal lahir"],
      ["address", "Alamat lengkap"],
      ["district", "Kecamatan"],
      ["city", "Kabupaten/Kota"],
      ["province", "Provinsi"],
    ] as const) {
      if (!teks(body[k])) throw new HttpError(400, `${label} wajib diisi.`);
    }
    if (phone.replace(/\D/g, "").length < 8) throw new HttpError(400, "Nomor WhatsApp wajib diisi.");
    if (teks(body.tftSudah) !== "Ya") {
      throw new HttpError(400, "Relawan pelatih harus sudah mengikuti TFT.");
    }
    if (!teks(body.tftInfo)) throw new HttpError(400, "Isi tahun / angkatan TFT-nya.");

    const db = adminDb();
    const dup = await db.collection("pelatih").where("phone", "==", phone).limit(1).get();
    if (!dup.empty) {
      throw new HttpError(
        409,
        "Nomor ini sudah terdata sebagai relawan pelatih. Hubungi admin kalau datanya perlu dikoreksi."
      );
    }

    const code = await createUniqueCodePelatih();
    await db.collection("pelatih").add({
      code,
      name,
      phone,
      nickname: teks(body.nickname),
      age: teks(body.age),
      gender: teks(body.gender),
      religion: teks(body.religion),
      maritalStatus: teks(body.maritalStatus),
      job: teks(body.job),
      birthPlace: teks(body.birthPlace),
      birthDate: teks(body.birthDate),
      address: teks(body.address),
      district: teks(body.district),
      city: teks(body.city),
      province: teks(body.province),
      tftSudah: "Ya",
      tftInfo: teks(body.tftInfo),
      note: "",
      source: "web-pendataan-rp",
      attendanceCount: 0,
      lastAttendedAt: null,
      createdAt: new Date().toISOString(),
    });

    return withCors(
      req,
      Response.json(
        {
          ok: true,
          success: true,
          code,
          message: "Barakallah! Data relawan pelatih sudah tersimpan.",
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
