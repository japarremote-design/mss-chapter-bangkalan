import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Perbaikan sekali jalan: member lama yang mengisi lewat /daftar-member
 * sebelum revisi masih berstatus "belum lapor" padahal sebelumnya sudah lapor
 * lewat Google Form. Hanya menyentuh member berasal dari form pendataan ulang
 * yang pusatOpenedAt-nya masih kosong.
 */
export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const db = adminDb();
    const snap = await db
      .collection("members")
      .where("source", "==", "web-pendataan-member")
      .get();
    const target = snap.docs.filter((d) => !d.get("pusatOpenedAt"));
    const now = new Date().toISOString();
    for (let i = 0; i < target.length; i += 400) {
      const batch = db.batch();
      for (const d of target.slice(i, i + 400)) batch.update(d.ref, { pusatOpenedAt: now });
      await batch.commit();
    }
    return Response.json({ ok: true, diperbarui: target.length });
  } catch (err) {
    return errorResponse(err);
  }
}
