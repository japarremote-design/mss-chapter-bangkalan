import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { memberFromDoc, recordAttendance } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Mode B: admin men-scan kartu QR milik anggota (isi QR = kode anggota). */
export async function POST(req: Request, { params }: Ctx) {
  try {
    await requireAdmin(req);
    const { id: sessionId } = await params;
    const body = await req.json();

    let memberId = String(body.memberId ?? "").trim();

    if (!memberId) {
      // Isi QR bisa berupa kode polos atau URL .../kartu/MSS-XXXXXX
      const raw = String(body.code ?? "").trim();
      const code = (raw.split("/").pop() ?? raw).trim().toUpperCase();
      if (!code) throw new HttpError(400, "Kode kartu kosong.");

      const hit = await adminDb()
        .collection("members")
        .where("code", "==", code)
        .limit(1)
        .get();
      if (hit.empty) throw new HttpError(404, `Kartu ${code} tidak terdaftar.`);
      memberId = hit.docs[0].id;
    }

    const result = await recordAttendance({ sessionId, memberId, method: "scan-kartu" });
    const member = memberFromDoc(await adminDb().collection("members").doc(memberId).get());

    return Response.json({
      ok: true,
      alreadyIn: result.alreadyIn,
      promoted: result.promoted,
      member,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
