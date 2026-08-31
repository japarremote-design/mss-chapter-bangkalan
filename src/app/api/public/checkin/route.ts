import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError } from "@/lib/auth";
import { createUniqueCode, recordAttendance } from "@/lib/data";
import { verifyToken } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Mode A: anggota scan QR di layar panitia lalu presensi sendiri.
 * Bisa memilih nama yang sudah terdaftar (memberId) atau mendaftar baru (name).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId = String(body.sessionId ?? "");
    const token = String(body.token ?? "");
    if (!verifyToken(sessionId, token)) {
      throw new HttpError(401, "QR sudah kedaluwarsa. Scan ulang di layar panitia.");
    }

    let memberId = String(body.memberId ?? "").trim();

    if (!memberId) {
      const name = String(body.name ?? "").trim();
      if (!name) throw new HttpError(400, "Pilih nama kamu atau isi nama untuk mendaftar.");
      const code = await createUniqueCode();
      const now = new Date().toISOString();
      const ref = await adminDb().collection("members").add({
        code,
        name,
        phone: String(body.phone ?? "").trim(),
        address: String(body.address ?? "").trim(),
        note: "",
        status: "calon",
        attendanceCount: 0,
        firstAttendedAt: null,
        lastAttendedAt: null,
        createdAt: now,
      });
      memberId = ref.id;
    }

    const result = await recordAttendance({ sessionId, memberId, method: "mandiri" });
    return Response.json({
      ok: true,
      alreadyIn: result.alreadyIn,
      promoted: result.promoted,
      name: result.record.name,
      code: result.record.code,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
