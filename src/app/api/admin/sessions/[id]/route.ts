import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { sessionFromDoc } from "@/lib/data";
import { currentToken, TOKEN_WINDOW_MS } from "@/lib/token";
import type { AttendanceRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const ref = adminDb().collection("sessions").doc(id);
    const [snap, attendance] = await Promise.all([
      ref.get(),
      ref.collection("attendance").orderBy("at", "desc").get(),
    ]);
    if (!snap.exists) throw new HttpError(404, "Sesi tidak ditemukan.");

    return Response.json({
      session: sessionFromDoc(snap),
      attendance: attendance.docs.map((d) => d.data() as AttendanceRecord),
      token: currentToken(id),
      tokenWindowMs: TOKEN_WINDOW_MS,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();

    const patch: Record<string, unknown> = {};
    for (const field of ["title", "location", "startTime", "date"] as const) {
      if (typeof body[field] === "string") patch[field] = body[field].trim();
    }
    if (typeof body.open === "boolean") patch.open = body.open;
    if (Object.keys(patch).length === 0) throw new HttpError(400, "Tidak ada data yang diubah.");

    const ref = adminDb().collection("sessions").doc(id);
    await ref.update(patch);
    return Response.json({ session: sessionFromDoc(await ref.get()) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const ref = adminDb().collection("sessions").doc(id);
    const attendance = await ref.collection("attendance").get();
    const batch = adminDb().batch();
    attendance.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(ref);
    await batch.commit();
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
