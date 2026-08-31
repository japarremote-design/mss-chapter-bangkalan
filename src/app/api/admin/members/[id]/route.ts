import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { memberFromDoc } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();

    const patch: Record<string, unknown> = {};
    for (const field of ["name", "phone", "address", "note"] as const) {
      if (typeof body[field] === "string") patch[field] = body[field].trim();
    }
    if (body.status === "calon" || body.status === "member") patch.status = body.status;
    if (Object.keys(patch).length === 0) throw new HttpError(400, "Tidak ada data yang diubah.");

    const ref = adminDb().collection("members").doc(id);
    await ref.update(patch);
    const snap = await ref.get();
    return Response.json({ member: memberFromDoc(snap) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    await adminDb().collection("members").doc(id).delete();
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
