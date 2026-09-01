import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError } from "@/lib/auth";
import { createUniqueCode, joinSession, leaveSession, memberFromDoc } from "@/lib/data";
import { verifyLinkToken } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard(body: { weekId?: string; token?: string }) {
  const weekId = String(body.weekId ?? "");
  if (!verifyLinkToken(weekId, String(body.token ?? ""))) {
    throw new HttpError(401, "Link tidak valid.");
  }
  return weekId;
}

/** Pastikan sesi yang dituju memang milik minggu di link tersebut. */
async function assertSessionInWeek(sessionId: string, weekId: string) {
  const snap = await adminDb().collection("sessions").doc(sessionId).get();
  if (!snap.exists || snap.data()?.weekId !== weekId) {
    throw new HttpError(404, "Sesi tidak ada di jadwal ini.");
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const weekId = await guard(body);
    const action = String(body.action ?? "");
    const db = adminDb();

    // 1. Cari nama untuk dipilih
    if (action === "cari") {
      const q = String(body.q ?? "").trim().toLowerCase();
      if (q.length < 2) return Response.json({ members: [] });
      const snap = await db.collection("members").orderBy("name").get();
      const members = snap.docs
        .map(memberFromDoc)
        .filter((m) => m.name.toLowerCase().includes(q))
        .slice(0, 12)
        .map((m) => ({ id: m.id, name: m.name, status: m.status }));
      return Response.json({ members });
    }

    // 2. Daftar baru untuk yang belum pernah terdaftar
    if (action === "daftar-baru") {
      const name = String(body.name ?? "").trim();
      const phone = String(body.phone ?? "").trim();
      if (name.length < 2) throw new HttpError(400, "Nama wajib diisi.");
      if (phone.replace(/\D/g, "").length < 8) throw new HttpError(400, "Nomor WhatsApp wajib diisi.");

      const dup = await db.collection("members").where("phone", "==", phone).limit(1).get();
      if (!dup.empty) {
        const m = memberFromDoc(dup.docs[0]);
        return Response.json({ member: { id: m.id, name: m.name }, existing: true });
      }

      const code = await createUniqueCode();
      const ref = await db.collection("members").add({
        code,
        name,
        phone,
        address: "",
        job: "",
        reason: "",
        note: "",
        status: "calon",
        attendanceCount: 0,
        firstAttendedAt: null,
        lastAttendedAt: null,
        createdAt: new Date().toISOString(),
        source: "rsvp",
      });
      return Response.json({ member: { id: ref.id, name }, existing: false }, { status: 201 });
    }

    // 3. Ikut / batal ikut satu sesi
    const memberId = String(body.memberId ?? "").trim();
    const sessionId = String(body.sessionId ?? "").trim();
    if (!memberId || !sessionId) throw new HttpError(400, "Data tidak lengkap.");
    await assertSessionInWeek(sessionId, weekId);

    if (action === "batal") {
      const res = await leaveSession(sessionId, memberId);
      return Response.json({ ok: true, joined: false, ...res });
    }

    if (action === "ikut") {
      const res = await joinSession(sessionId, memberId);
      return Response.json({ ok: true, joined: true, alreadyIn: res.alreadyIn });
    }

    throw new HttpError(400, "Aksi tidak dikenal.");
  } catch (err) {
    return errorResponse(err);
  }
}

/** Sesi mana saja yang sudah diikuti seseorang di minggu ini. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const weekId = url.searchParams.get("weekId") ?? "";
    const memberId = url.searchParams.get("memberId") ?? "";
    if (!verifyLinkToken(weekId, url.searchParams.get("k") ?? "")) {
      throw new HttpError(401, "Link tidak valid.");
    }
    if (!memberId) return Response.json({ joined: [] });

    const db = adminDb();
    const sessions = await db.collection("sessions").where("weekId", "==", weekId).get();
    const joined: string[] = [];
    await Promise.all(
      sessions.docs.map(async (s) => {
        const hit = await s.ref.collection("rsvp").doc(memberId).get();
        if (hit.exists) joined.push(s.id);
      })
    );
    return Response.json({ joined });
  } catch (err) {
    return errorResponse(err);
  }
}
