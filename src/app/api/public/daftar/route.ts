import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError } from "@/lib/auth";
import { createUniqueCode } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Pendaftaran calon anggota dari halaman publik (belum pernah ikut latihan). */
export async function POST(req: Request) {
  try {
    if (process.env.PUBLIC_REGISTRATION === "off") {
      throw new HttpError(403, "Pendaftaran online sedang ditutup.");
    }

    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    if (name.length < 2) throw new HttpError(400, "Nama wajib diisi.");
    if (phone.length < 8) throw new HttpError(400, "Nomor WhatsApp wajib diisi.");

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
      address: String(body.address ?? "").trim(),
      note: String(body.note ?? "").trim(),
      status: "calon",
      attendanceCount: 0,
      firstAttendedAt: null,
      lastAttendedAt: null,
      createdAt: new Date().toISOString(),
    });

    return Response.json({ ok: true, code }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
