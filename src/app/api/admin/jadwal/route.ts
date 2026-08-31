import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { listSchedules } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    return Response.json({ schedules: await listSchedules() });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const day = String(body.day ?? "").trim();
    const time = String(body.time ?? "").trim();
    if (!day) throw new HttpError(400, "Hari wajib diisi.");
    if (!time) throw new HttpError(400, "Jam wajib diisi.");

    const existing = await listSchedules();
    const doc = {
      day,
      time,
      pool: String(body.pool ?? "").trim(),
      status: body.status === "Penuh" ? "Penuh" : "Tersedia",
      order: existing.length ? Math.max(...existing.map((s) => s.order)) + 1 : 1,
    };
    const ref = await adminDb().collection("schedules").add(doc);
    return Response.json({ schedule: { id: ref.id, ...doc } }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
