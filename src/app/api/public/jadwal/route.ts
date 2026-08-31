import { listSchedules } from "@/lib/data";
import { preflight, withCors } from "@/lib/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return preflight(req);
}

/**
 * Jadwal latihan untuk konsumsi publik (mis. situs Blogger).
 * Format kunci sengaja disamakan dengan Apps Script lama supaya kode Blogger
 * yang sudah ada tidak perlu diubah — cukup ganti URL-nya:
 *   [{ "Hari": "...", "Jam": "...", "Lokasi Kolam": "...", "Status": "..." }]
 */
export async function GET(req: Request) {
  try {
    const schedules = await listSchedules();
    const legacy = schedules.map((s) => ({
      Hari: s.day,
      Jam: s.time,
      "Lokasi Kolam": s.pool,
      Status: s.status,
    }));
    return withCors(req, Response.json(legacy));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal memuat jadwal.";
    return withCors(req, Response.json({ error: message }, { status: 500 }));
  }
}
