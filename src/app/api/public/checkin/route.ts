import { errorResponse, HttpError } from "@/lib/auth";
import { recordAttendance } from "@/lib/data";
import { linkToken } from "@/lib/token";
import { verifyToken } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mode A: member scan QR di layar relawan pelatih lalu presensi sendiri.
 * Hanya untuk yang sudah ngelist ikut latihan ini (dicek di recordAttendance).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId = String(body.sessionId ?? "");
    const token = String(body.token ?? "");
    if (!verifyToken(sessionId, token)) {
      throw new HttpError(401, "QR sudah kedaluwarsa. Scan ulang di layar panitia.");
    }

    const memberId = String(body.memberId ?? "").trim();
    if (!memberId) throw new HttpError(400, "Pilih namamu dulu.");

    const result = await recordAttendance({ sessionId, memberId, method: "mandiri" });
    return Response.json({
      ok: true,
      alreadyIn: result.alreadyIn,
      promoted: result.promoted,
      name: result.record.name,
      code: result.record.code,
      memberId,
      memberToken: linkToken(memberId),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
