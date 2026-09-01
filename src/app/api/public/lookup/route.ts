import { errorResponse, HttpError } from "@/lib/auth";
import { listRsvp } from "@/lib/data";
import { verifyToken } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cari nama untuk presensi mandiri.
 * Hanya mencari di antara yang sudah ngelist ikut sesi ini — orang lain
 * memang tidak boleh presensi, jadi tidak perlu ditampilkan.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId = String(body.sessionId ?? "");
    const token = String(body.token ?? "");
    const q = String(body.q ?? "").trim().toLowerCase();

    if (!verifyToken(sessionId, token)) throw new HttpError(401, "QR sudah kedaluwarsa.");
    if (q.length < 2) return Response.json({ members: [] });

    const rsvp = await listRsvp(sessionId);
    const members = rsvp
      .filter((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
      .slice(0, 12)
      .map((r) => ({ id: r.memberId, name: r.name, attended: r.attended }));

    return Response.json({ members });
  } catch (err) {
    return errorResponse(err);
  }
}
