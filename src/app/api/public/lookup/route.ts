import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError } from "@/lib/auth";
import { memberFromDoc } from "@/lib/data";
import { verifyToken } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Cari nama anggota untuk presensi mandiri. Hanya mengembalikan id + nama. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId = String(body.sessionId ?? "");
    const token = String(body.token ?? "");
    const q = String(body.q ?? "").trim().toLowerCase();

    if (!verifyToken(sessionId, token)) throw new HttpError(401, "QR sudah kedaluwarsa.");
    if (q.length < 2) return Response.json({ members: [] });

    const snap = await adminDb().collection("members").orderBy("name").get();
    const members = snap.docs
      .map(memberFromDoc)
      .filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q))
      .slice(0, 12)
      .map((m) => ({ id: m.id, name: m.name, status: m.status }));

    return Response.json({ members });
  } catch (err) {
    return errorResponse(err);
  }
}
