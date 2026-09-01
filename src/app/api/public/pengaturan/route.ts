import { errorResponse } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Link grup WhatsApp untuk ditampilkan di halaman publik. */
export async function GET() {
  try {
    const s = await getSettings();
    return Response.json({
      waGroupCalon: s.waGroupCalon,
      waGroupMember: s.waGroupMember,
      pesanPembuka: s.pesanPembuka,
      pesanCatatan: s.pesanCatatan,
      htmDefault: s.htmDefault,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
