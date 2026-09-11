import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { memberFromDoc, resetIndeksNama } from "@/lib/data";
import type { Verifikasi } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const SAH: Verifikasi[] = ["menunggu", "disetujui", "ditunda", "ditolak"];

/**
 * Hasil screening pengurus untuk satu calon member.
 *
 * Hanya "disetujui" yang membuka akses ngelist & presensi. "ditunda" dipakai
 * untuk kondisi sementara (mis. sedang sakit) yang bisa dibuka lagi nanti,
 * "ditolak" untuk yang memang tidak bisa dilanjutkan.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;
    const body = await req.json();

    const verifikasi = String(body.verifikasi ?? "") as Verifikasi;
    if (!SAH.includes(verifikasi)) throw new HttpError(400, "Status verifikasi tidak dikenal.");

    const catatan = String(body.catatan ?? "").trim().slice(0, 500);
    if (verifikasi === "ditunda" && !catatan) {
      throw new HttpError(400, "Tulis alasan penundaan supaya pengurus lain paham.");
    }
    if (verifikasi === "ditolak" && !catatan) {
      throw new HttpError(400, "Tulis alasan penolakan supaya bisa dipertanggungjawabkan.");
    }

    const ref = adminDb().collection("members").doc(id);
    if (!(await ref.get()).exists) throw new HttpError(404, "Data member tidak ditemukan.");

    await ref.update({
      verifikasi,
      verifikasiCatatan: catatan,
      verifikasiAt: new Date().toISOString(),
      verifikasiBy: admin.email,
    });
    resetIndeksNama();

    return Response.json({ member: memberFromDoc(await ref.get()) });
  } catch (err) {
    return errorResponse(err);
  }
}
