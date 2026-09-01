import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError } from "@/lib/auth";
import { memberFromDoc } from "@/lib/data";
import { buildPrefillUrl, getPusatConfig, isianKurang } from "@/lib/pusat";
import { verifyLinkToken } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ambilMember(memberId: string, token: string) {
  if (!verifyLinkToken(memberId, token)) throw new HttpError(401, "Tautan tidak valid.");
  const snap = await adminDb().collection("members").doc(memberId).get();
  if (!snap.exists) throw new HttpError(404, "Data member tidak ditemukan.");
  return memberFromDoc(snap);
}

/** Cek apa saja yang masih perlu diisi member sebelum lapor ke MSS Pusat. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const member = await ambilMember(
      url.searchParams.get("memberId") ?? "",
      url.searchParams.get("k") ?? ""
    );
    const config = await getPusatConfig();
    if (!config || !config.formUrl) return Response.json({ aktif: false });

    return Response.json({
      aktif: true,
      name: member.name,
      kurang: isianKurang(config, member),
      sudahDibuka: Boolean(member.pusatOpenedAt),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Simpan data tambahan, lalu kembalikan URL formulir pusat yang sudah terisi. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const memberId = String(body.memberId ?? "");
    const member = await ambilMember(memberId, String(body.token ?? ""));

    const config = await getPusatConfig();
    if (!config || !config.formUrl) {
      throw new HttpError(409, "Sambungan ke formulir MSS Pusat belum disiapkan pengurus.");
    }

    const patch: Record<string, string> = {};
    for (const f of ["birthPlace", "birthDate", "district", "city", "province"] as const) {
      const v = String(body[f] ?? "").trim();
      if (v) patch[f] = v;
    }

    const terbaru = { ...member, ...patch };
    const kurang = isianKurang(config, terbaru);
    if (kurang.length > 0) throw new HttpError(400, "Masih ada isian yang kosong.");

    const now = new Date().toISOString();
    await adminDb()
      .collection("members")
      .doc(memberId)
      .update({ ...patch, pusatOpenedAt: now });

    return Response.json({ ok: true, url: buildPrefillUrl(config, terbaru) });
  } catch (err) {
    return errorResponse(err);
  }
}
