import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError } from "@/lib/auth";
import { memberFromDoc, recordAttendance } from "@/lib/data";
import { verifyLinkToken } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Relawan pelatih memindai kartu QR member, lewat link relawan pelatih (tanpa akun). */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id: sessionId } = await params;
    const body = await req.json();
    if (!verifyLinkToken(sessionId, String(body.k ?? ""))) {
      throw new HttpError(401, "Link relawan pelatih tidak valid.");
    }

    const raw = String(body.code ?? "").trim();
    const code = (raw.split("/").pop() ?? raw).trim().toUpperCase();
    if (!code) throw new HttpError(400, "Kode kartu kosong.");

    const hit = await adminDb().collection("members").where("code", "==", code).limit(1).get();
    if (hit.empty) throw new HttpError(404, `Kartu ${code} tidak terdaftar.`);
    const memberId = hit.docs[0].id;

    const result = await recordAttendance({
      sessionId,
      memberId,
      method: "scan-kartu",
      force: body.force === true,
    });

    return Response.json({
      ok: true,
      alreadyIn: result.alreadyIn,
      promoted: result.promoted,
      member: memberFromDoc(hit.docs[0]),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
