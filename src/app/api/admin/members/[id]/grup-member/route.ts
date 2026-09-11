import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { memberFromDoc } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Tandai bahwa pengurus sudah mengirim link grup WhatsApp Member ke orang ini.
 *
 * Naik status jadi member (latihan pertama) tidak otomatis membuka grup —
 * pengurus mengonfirmasi dulu secara manual, lalu menandai di sini supaya
 * tidak terus muncul di daftar "menunggu link dikirim".
 */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;

    const ref = adminDb().collection("members").doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, "Data member tidak ditemukan.");
    if (snap.data()?.status !== "member") {
      throw new HttpError(409, "Belum berstatus member — belum ikut latihan pertama.");
    }

    await ref.update({
      grupMemberDikirimAt: new Date().toISOString(),
      grupMemberDikirimBy: admin.email,
    });

    return Response.json({ member: memberFromDoc(await ref.get()) });
  } catch (err) {
    return errorResponse(err);
  }
}
