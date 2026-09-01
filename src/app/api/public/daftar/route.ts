import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError } from "@/lib/auth";
import { createUniqueCode } from "@/lib/data";
import { preflight, withCors } from "@/lib/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return preflight(req);
}

const teks = (v: unknown) => String(v ?? "").trim();

/**
 * Pendaftaran calon member — isian mengikuti formulir MSS.
 * Menerima nama field versi baru maupun versi lama Apps Script / Google Form
 * (nama/whatsapp/pekerjaan/alasan) supaya kode Blogger lama tetap jalan.
 */
export async function POST(req: Request) {
  try {
    if (process.env.PUBLIC_REGISTRATION === "off") {
      throw new HttpError(403, "Pendaftaran online sedang ditutup.");
    }

    const body = await req.json();

    const name = teks(body.name ?? body.nama);
    const phone = teks(body.phone ?? body.whatsapp ?? body.noWa);
    if (name.length < 2) throw new HttpError(400, "Nama lengkap wajib diisi.");
    if (phone.replace(/\D/g, "").length < 8) throw new HttpError(400, "Nomor WhatsApp wajib diisi.");

    const db = adminDb();
    const dup = await db.collection("members").where("phone", "==", phone).limit(1).get();
    if (!dup.empty) {
      throw new HttpError(
        409,
        "Nomor ini sudah terdaftar. Hubungi relawan pelatih kalau perlu bantuan."
      );
    }

    const code = await createUniqueCode();
    await db.collection("members").add({
      code,
      name,
      phone,
      nickname: teks(body.nickname ?? body.panggilan),
      age: teks(body.age ?? body.usia),
      gender: teks(body.gender ?? body.jenisKelamin),
      religion: teks(body.religion ?? body.agama),
      address: teks(body.address ?? body.alamat),
      job: teks(body.job ?? body.pekerjaan),
      maritalStatus: teks(body.maritalStatus ?? body.statusPernikahan),
      canSwim: teks(body.canSwim ?? body.bisaBerenang),
      waterTrauma: teks(body.waterTrauma ?? body.traumaAir),
      healthNotes: teks(body.healthNotes ?? body.riwayatPenyakit),
      isSwimCoach: teks(body.isSwimCoach ?? body.pelatihRenang),
      knowFrom: teks(body.knowFrom ?? body.kenalMelalui),
      reason: teks(body.reason ?? body.motivasi ?? body.alasan),
      note: "",
      status: "calon",
      attendanceCount: 0,
      firstAttendedAt: null,
      lastAttendedAt: null,
      createdAt: new Date().toISOString(),
      source: teks(body.source) || "web",
    });

    return withCors(
      req,
      Response.json(
        {
          ok: true,
          success: true, // kompatibel dengan kode Blogger lama
          code,
          message: "Barakallah! Pendaftaran Anda berhasil disimpan.",
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
