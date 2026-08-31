import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError } from "@/lib/auth";
import { sessionFromDoc } from "@/lib/data";
import { verifyToken } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Info sesi untuk halaman presensi mandiri. Butuh token QR yang masih berlaku. */
export async function GET(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const token = new URL(req.url).searchParams.get("t") ?? "";
    if (!verifyToken(id, token)) {
      throw new HttpError(401, "QR sudah kedaluwarsa. Silakan scan ulang di layar panitia.");
    }

    const snap = await adminDb().collection("sessions").doc(id).get();
    if (!snap.exists) throw new HttpError(404, "Sesi tidak ditemukan.");
    const session = sessionFromDoc(snap);
    if (!session.open) throw new HttpError(409, "Presensi untuk sesi ini sudah ditutup.");

    return Response.json({
      session: {
        id: session.id,
        title: session.title,
        date: session.date,
        startTime: session.startTime,
        location: session.location,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
