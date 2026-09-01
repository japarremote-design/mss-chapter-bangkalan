import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError } from "@/lib/auth";
import { listRsvp, sessionFromDoc, weekFromDoc } from "@/lib/data";
import { verifyLinkToken } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Isi halaman "ngelist ikut latihan" yang linknya dishare ke grup WhatsApp. */
export async function GET(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const token = new URL(req.url).searchParams.get("k") ?? "";
    if (!verifyLinkToken(id, token)) throw new HttpError(401, "Link tidak valid.");

    const db = adminDb();
    const [weekSnap, sessionSnap] = await Promise.all([
      db.collection("weeks").doc(id).get(),
      db.collection("sessions").where("weekId", "==", id).get(),
    ]);
    if (!weekSnap.exists) throw new HttpError(404, "Jadwal tidak ditemukan.");

    const week = weekFromDoc(weekSnap);
    const urut = sessionSnap.docs
      .map(sessionFromDoc)
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

    const sessions = await Promise.all(
      urut.map(async (s) => ({
        id: s.id,
        title: s.title,
        date: s.date,
        startTime: s.startTime,
        location: s.location,
        coaches: s.coaches,
        fee: s.fee,
        quota: s.quota,
        rsvpCount: s.rsvpCount,
        open: s.open,
        full: s.quota > 0 && s.rsvpCount >= s.quota,
        // Daftar nama sengaja ditampilkan, meniru kebiasaan list di grup WhatsApp.
        names: (await listRsvp(s.id)).map((r) => r.name),
      }))
    );

    return Response.json({ week: { id: week.id, label: week.label, open: week.open }, sessions });
  } catch (err) {
    return errorResponse(err);
  }
}
