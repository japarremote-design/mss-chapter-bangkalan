import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { listRsvp, sessionFromDoc } from "@/lib/data";
import { currentToken, linkToken, TOKEN_WINDOW_MS } from "@/lib/token";
import type { AttendanceRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const ref = adminDb().collection("sessions").doc(id);
    const [snap, attendance, rsvp] = await Promise.all([
      ref.get(),
      ref.collection("attendance").orderBy("at", "desc").get(),
      listRsvp(id),
    ]);
    if (!snap.exists) throw new HttpError(404, "Sesi tidak ditemukan.");

    return Response.json({
      session: sessionFromDoc(snap),
      attendance: attendance.docs.map((d) => d.data() as AttendanceRecord),
      rsvp,
      token: currentToken(id),
      relawanToken: linkToken(id),
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

/**
 * Soft delete: sesi disembunyikan dari semua daftar & tidak bisa dipakai lagi,
 * tapi data sesi, daftar ikut, dan daftar hadir TETAP ada di database.
 * Untuk memulihkan, hapus kolom deletedAt di Firestore.
 */
export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;
    const db = adminDb();
    const ref = db.collection("sessions").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, "Sesi tidak ditemukan.");
    if (snap.get("deletedAt")) return Response.json({ ok: true });
    const batch = db.batch();
    batch.update(ref, { deletedAt: new Date().toISOString(), deletedBy: admin.email });
    const weekId = snap.data()?.weekId;
    if (weekId) {
      batch.update(db.collection("weeks").doc(String(weekId)), {
        sessionCount: FieldValue.increment(-1),
      });
    }
    await batch.commit();
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
