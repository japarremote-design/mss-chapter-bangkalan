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
    return Response.json({ sessions: snap.docs.map(sessionFromDoc) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    const date = String(body.date ?? "").trim();
    if (!title) throw new HttpError(400, "Judul latihan wajib diisi.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "Tanggal tidak valid.");

    const doc = {
      title,
      date,
      startTime: String(body.startTime ?? "").trim(),
      location: String(body.location ?? "").trim(),
      open: true,
      attendeeCount: 0,
      createdAt: new Date().toISOString(),
      createdBy: admin.email,
    };
    const ref = await adminDb().collection("sessions").add(doc);
    return Response.json({ session: { id: ref.id, ...doc } }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
