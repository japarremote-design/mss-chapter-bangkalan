import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { sessionFromDoc } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const snap = await adminDb()
      .collection("sessions")
      .orderBy("date", "desc")
      .limit(100)
      .get();
    return Response.json({ sessions: snap.docs.map(sessionFromDoc).filter((s) => !s.deletedAt) });
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * Sesi tidak dibuat satu per satu di sini. Semuanya lahir dari paket jadwal
 * mingguan (/api/admin/weeks) supaya selalu punya weekId — tanpa itu sesinya
 * tidak muncul di link "ngelist" dan kehadirannya tidak bisa dicatat.
 */
export async function POST() {
  return errorResponse(
    new HttpError(405, "Buat sesi lewat menu Jadwal Mingguan, bukan satu per satu.")
  );
}
