import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { memberFromDoc, resetIndeksNama } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();

    if (body.pulihkan === true) {
      const r = adminDb().collection("members").doc(id);
      await r.update({ deletedAt: null, deletedBy: "" });
      resetIndeksNama();
      return Response.json({ member: memberFromDoc(await r.get()) });
    }

    const patch: Record<string, unknown> = {};
    for (const field of ["name", "phone", "address", "job", "reason", "note"] as const) {
      if (typeof body[field] === "string") patch[field] = body[field].trim();
    }
    if (body.status === "calon" || body.status === "member") patch.status = body.status;
    if (Object.keys(patch).length === 0) throw new HttpError(400, "Tidak ada data yang diubah.");

    const ref = adminDb().collection("members").doc(id);
    await ref.update(patch);
    resetIndeksNama();
    const snap = await ref.get();
    return Response.json({ member: memberFromDoc(snap) });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * Default: soft delete — member disembunyikan dari semua daftar, tidak bisa
 * ngelist/presensi, tapi datanya (termasuk riwayat hadir) tetap ada.
 * ?permanen=1: hapus betul-betul, hanya untuk yang SUDAH ada di daftar "dihapus".
 */
export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;
    const ref = adminDb().collection("members").doc(id);
    if (new URL(req.url).searchParams.get("permanen") === "1") {
      const snap = await ref.get();
      if (!snap.get("deletedAt")) {
        throw new HttpError(409, "Hapus biasa dulu (masuk daftar dihapus) sebelum hapus permanen.");
      }
      await ref.delete();
    } else {
      await ref.update({ deletedAt: new Date().toISOString(), deletedBy: admin.email });
    }
    resetIndeksNama();
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
