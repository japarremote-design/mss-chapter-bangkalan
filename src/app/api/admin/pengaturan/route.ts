import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { getSettings, saveSettings, validasiLinkGrup } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    return Response.json({ settings: await getSettings() });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();

    let waGroupCalon = "";
    let waGroupMember = "";
    try {
      waGroupCalon = validasiLinkGrup(String(body.waGroupCalon ?? ""));
      waGroupMember = validasiLinkGrup(String(body.waGroupMember ?? ""));
    } catch (e) {
      throw new HttpError(400, (e as Error).message);
    }

    const settings = await saveSettings(
      {
        waGroupCalon,
        waGroupMember,
        pesanPembuka: String(body.pesanPembuka ?? ""),
        pesanCatatan: String(body.pesanCatatan ?? ""),
        htmDefault: String(body.htmDefault ?? ""),
      },
      admin.email
    );
    return Response.json({ settings });
  } catch (err) {
    return errorResponse(err);
  }
}
