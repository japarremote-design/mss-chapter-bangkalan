import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { createUniqueCode, memberFromDoc, resetIndeksNama } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const snap = await adminDb().collection("members").orderBy("name").get();
    return Response.json({ members: snap.docs.map(memberFromDoc) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (!name) throw new HttpError(400, "Nama wajib diisi.");

    const code = await createUniqueCode();
    const now = new Date().toISOString();
    const doc = {
      code,
      name,
      phone: String(body.phone ?? "").trim(),
      address: String(body.address ?? "").trim(),
      job: String(body.job ?? "").trim(),
      reason: String(body.reason ?? "").trim(),
      note: String(body.note ?? "").trim(),
      status: body.status === "member" ? ("member" as const) : ("calon" as const),
      // Ditambahkan langsung oleh pengurus, berarti sudah lewat screening.
      verifikasi: "disetujui" as const,
      verifikasiAt: now,
      verifikasiBy: admin.email,
      verifikasiCatatan: "Ditambahkan langsung oleh pengurus.",
      // Kalau langsung dimasukkan berstatus member, anggap pengurus sudah tahu
      // dan menanganinya sendiri — gerbang konfirmasi grup hanya untuk member
      // yang naik status otomatis lewat presensi (scan QR sendiri, tanpa pengurus).
      grupMemberDikirimAt: body.status === "member" ? now : null,
      grupMemberDikirimBy: body.status === "member" ? admin.email : "",
      attendanceCount: 0,
      firstAttendedAt: null,
      lastAttendedAt: null,
      createdAt: now,
    };
    const ref = await adminDb().collection("members").add(doc);
    resetIndeksNama();
    return Response.json({ member: { id: ref.id, ...doc } }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
