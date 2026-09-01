import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError } from "@/lib/auth";
import { listRsvp, sessionFromDoc } from "@/lib/data";
import { currentToken, verifyLinkToken } from "@/lib/token";
import type { AttendanceRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Data untuk halaman relawan pelatih — tanpa akun, cukup link
 * bertanda tangan. Hanya membuka satu sesi: QR, daftar ikut, daftar hadir.
 */
export async function GET(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const k = new URL(req.url).searchParams.get("k") ?? "";
    if (!verifyLinkToken(id, k)) throw new HttpError(401, "Link relawan pelatih tidak valid.");

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
    });
  } catch (err) {
    return errorResponse(err);
  }
}
