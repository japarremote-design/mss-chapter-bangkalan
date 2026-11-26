import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { pelatihFromDoc } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const ref = adminDb().collection("pelatih").doc(id);

    if (body.pulihkan === true) {
      await ref.update({ deletedAt: null, deletedBy: "" });
      return Response.json({ pelatih: pelatihFromDoc(await ref.get()) });
    }

    const patch: Record<string, unknown> = {};
    for (const f of ["name", "phone", "address", "job", "tftInfo", "note"] as const) {
      if (typeof body[f] === "string") patch[f] = body[f].trim();
    }
    if (Object.keys(patch).length === 0) throw new HttpError(400, "Tidak ada data yang diubah.");
    await ref.update(patch);
    return Response.json({ pelatih: pelatihFromDoc(await ref.get()) });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Default soft delete; ?permanen=1 hanya untuk yang sudah ada di Sampah. */
export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;
    const ref = adminDb().collection("pelatih").doc(id);
    if (new URL(req.url).searchParams.get("permanen") === "1") {
      const snap = await ref.get();
      if (!snap.get("deletedAt")) {
        throw new HttpError(409, "Hapus biasa dulu (masuk Sampah) sebelum hapus permanen.");
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
