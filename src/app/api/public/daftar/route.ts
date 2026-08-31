import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError } from "@/lib/auth";
import { createUniqueCode } from "@/lib/data";
import { preflight, withCors } from "@/lib/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return preflight(req);
}

/**
 * Pendaftaran calon anggota. Dipakai halaman /daftar dan juga situs Blogger.
 * Menerima nama field versi baru (name/phone) maupun versi lama Apps Script
 * (nama/whatsapp/pekerjaan/alasan) supaya kode Blogger lama tetap jalan.
 */
export async function POST(req: Request) {
  try {
    if (process.env.PUBLIC_REGISTRATION === "off") {
      throw new HttpError(403, "Pendaftaran online sedang ditutup.");
    }

    const body = await req.json();
    const name = String(body.name ?? body.nama ?? "").trim();
    const phone = String(body.phone ?? body.whatsapp ?? "").trim();
    const job = String(body.job ?? body.pekerjaan ?? "").trim();
    const reason = String(body.reason ?? body.alasan ?? "").trim();
    const address = String(body.address ?? body.alamat ?? "").trim();

    if (name.length < 2) throw new HttpError(400, "Nama wajib diisi.");
    if (phone.replace(/\D/g, "").length < 8) throw new HttpError(400, "Nomor WhatsApp wajib diisi.");

    const db = adminDb();
    const dup = await db.collection("members").where("phone", "==", phone).limit(1).get();
    if (!dup.empty) {
      throw new HttpError(409, "Nomor ini sudah terdaftar. Hubungi pengurus kalau perlu bantuan.");
    }

    const code = await createUniqueCode();
    await db.collection("members").add({
      code,
      name,
      phone,
      address,
      job,
      reason,
      note: "",
      status: "calon",
      attendanceCount: 0,
      firstAttendedAt: null,
      lastAttendedAt: null,
      createdAt: new Date().toISOString(),
      source: String(body.source ?? "web").trim(),
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
    const data = { success: false, error: "" };
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
