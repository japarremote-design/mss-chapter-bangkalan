import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin } from "@/lib/auth";
import { pelatihFromDoc } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const dihapus = new URL(req.url).searchParams.get("dihapus") === "1";
    const snap = await adminDb().collection("pelatih").orderBy("name").get();
    const pelatih = snap.docs.map(pelatihFromDoc).filter((p) => Boolean(p.deletedAt) === dihapus);
    return Response.json({ pelatih });
  } catch (err) {
    return errorResponse(err);
  }
}
