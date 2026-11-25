import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { scheduleFromDoc } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();

    if (body.pulihkan === true) {
      const r = adminDb().collection("schedules").doc(id);
      await r.update({ deletedAt: null, deletedBy: "" });
      return Response.json({ schedule: scheduleFromDoc(await r.get()) });
    }

    const patch: Record<string, unknown> = {};
    for (const field of ["day", "time", "pool"] as const) {
      if (typeof body[field] === "string") patch[field] = body[field].trim();
    }
    if (body.status === "Tersedia" || body.status === "Penuh") patch.status = body.status;
    if (typeof body.order === "number") patch.order = body.order;
    if (Object.keys(patch).length === 0) throw new HttpError(400, "Tidak ada data yang diubah.");

    const ref = adminDb().collection("schedules").doc(id);
    await ref.update(patch);
    return Response.json({ schedule: scheduleFromDoc(await ref.get()) });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * Default: soft delete (disembunyikan, data tetap ada, bisa dipulihkan).
 * ?permanen=1: hapus betul-betul — hanya untuk yang SUDAH ada di daftar "dihapus".
 */
export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;
    const ref = adminDb().collection("schedules").doc(id);
    if (new URL(req.url).searchParams.get("permanen") === "1") {
      const snap = await ref.get();
      if (!snap.get("deletedAt")) {
        throw new HttpError(409, "Hapus biasa dulu (masuk daftar dihapus) sebelum hapus permanen.");
      }
      await ref.delete();
    } else {
      await ref.update({ deletedAt: new Date().toISOString(), deletedBy: admin.email });
    }
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
