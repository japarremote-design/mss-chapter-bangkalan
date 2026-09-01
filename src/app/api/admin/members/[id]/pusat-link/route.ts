import { errorResponse, requireAdmin } from "@/lib/auth";
import { linkToken } from "@/lib/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Tautan pendataan MSS Pusat untuk satu member, dikirim pengurus lewat WhatsApp. */
export async function GET(req: Request, { params }: Ctx) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const origin = new URL(req.url).origin;
    return Response.json({ url: `${origin}/pusat/${id}?k=${linkToken(id)}` });
  } catch (err) {
    return errorResponse(err);
  }
}
