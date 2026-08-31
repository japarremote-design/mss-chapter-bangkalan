import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { createUniqueCode, memberFromDoc } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const snap = await adminDb().collection("members").orderBy("name").get();
    return Response.json({ members: snap.docs.map(memberFromDoc) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (!name) throw new HttpError(400, "Nama wajib diisi.");

    const code = await createUniqueCode();
    const now = new Date().toISOString();
    const doc = {
      code,
      name,
      phone: String(body.phone ?? "").trim(),
      address: String(body.address ?? "").trim(),
      note: String(body.note ?? "").trim(),
      status: "calon" as const,
      attendanceCount: 0,
      firstAttendedAt: null,
      lastAttendedAt: null,
      createdAt: now,
    };
    const ref = await adminDb().collection("members").add(doc);
    return Response.json({ member: { id: ref.id, ...doc } }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
