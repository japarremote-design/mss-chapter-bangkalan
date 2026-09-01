import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { FIELD_OPTIONS, getPusatConfig, parsePrefillUrl } from "@/lib/pusat";
import type { PusatEntry } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    return Response.json({ config: await getPusatConfig(), fields: FIELD_OPTIONS });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Tempel tautan isian otomatis → app membaca daftar pertanyaannya. */
export async function PUT(req: Request) {
  try {
    await requireAdmin(req);
    const { url } = await req.json();
    if (!url) throw new HttpError(400, "Tautan belum diisi.");

    let hasil;
    try {
      hasil = parsePrefillUrl(String(url));
    } catch (e) {
      throw new HttpError(400, (e as Error).message);
    }

    // Pertahankan pemetaan lama untuk pertanyaan yang ID-nya tidak berubah.
    const lama = await getPusatConfig();
    const sebelumnya = new Map((lama?.entries ?? []).map((e) => [e.entryId, e.field]));
    const entries = hasil.entries.map((e) => ({ ...e, field: sebelumnya.get(e.entryId) ?? "" }));

    return Response.json({ formUrl: hasil.formUrl, entries });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Simpan pemetaan final. */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const formUrl = String(body.formUrl ?? "").trim();
    const entries: PusatEntry[] = Array.isArray(body.entries) ? body.entries : [];

    if (!formUrl.startsWith("https://docs.google.com/")) {
      throw new HttpError(400, "Alamat formulir tidak valid.");
    }
    if (entries.length === 0) throw new HttpError(400, "Belum ada pertanyaan yang dipetakan.");

    const bersih = entries.map((e) => ({
      entryId: String(e.entryId),
      type: e.type === "date" ? "date" : "text",
      sample: String(e.sample ?? ""),
      field: FIELD_OPTIONS.some((f) => f.key === e.field) ? String(e.field) : "",
    }));

    await adminDb()
      .collection("config")
      .doc("pusat")
      .set({
        formUrl,
        entries: bersih,
        updatedAt: new Date().toISOString(),
        updatedBy: admin.email,
      });

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin(req);
    await adminDb().collection("config").doc("pusat").delete();
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
