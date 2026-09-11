import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError } from "@/lib/auth";
import { bacaVerifikasi, cariNama, joinSession, leaveSession } from "@/lib/data";
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

    // 1. Cari nama untuk dipilih
    if (action === "cari") {
      const q = String(body.q ?? "").trim();
      if (q.length < 2) return Response.json({ members: [] });
      return Response.json({ members: await cariNama(q) });
    }

    // Jalan pintas "daftar cukup nama + nomor" sengaja ditutup: yang ngelist
    // harus sudah terdata lengkap lewat formulir pendaftaran, supaya relawan
    // pelatih tahu riwayat kesehatan dan kemampuan renangnya sebelum di kolam.
    if (action === "daftar-baru") {
      throw new HttpError(
        403,
        "Namamu belum terdata. Isi dulu formulir pendaftaran di halaman utama, lalu buka kembali link jadwal ini."
      );
    }

    // 2. Ikut / batal ikut satu sesi
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
    // Status verifikasi dibaca ulang tiap kali halaman dibuka — pilihan "siapa
    // saya" tersimpan di HP, jadi datanya bisa saja sudah basi.
    const memberSnap = await db.collection("members").doc(memberId).get();
    const verifikasi = bacaVerifikasi(memberSnap.get("verifikasi"));
    const catatan = String(memberSnap.get("verifikasiCatatan") ?? "");

    const sessions = await db.collection("sessions").where("weekId", "==", weekId).get();
    const joined: string[] = [];
    await Promise.all(
      sessions.docs.map(async (s) => {
        const hit = await s.ref.collection("rsvp").doc(memberId).get();
        if (hit.exists) joined.push(s.id);
      })
    );
    return Response.json({ joined, verifikasi, catatan });
  } catch (err) {
    return errorResponse(err);
  }
}
