import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Member yang sudah pernah isi pendataan (atau daftar biasa) tapi kehilangan
 * screenshot QR-nya bisa cari ulang di sini — cukup nama + no. WhatsApp yang
 * dipakai saat mengisi, supaya tidak perlu hubungi admin untuk hal sesepele
 * itu. Dicocokkan dari NOMOR (unik per member), nama hanya penguat supaya
 * typo nomor tidak menampilkan kode orang lain secara kebetulan.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    if (phone.replace(/\D/g, "").length < 8) {
      throw new HttpError(400, "Nomor WhatsApp wajib diisi.");
    }

    const snap = await adminDb().collection("members").where("phone", "==", phone).limit(1).get();
    if (snap.empty) {
      throw new HttpError(404, "Tidak ditemukan. Cek lagi nomornya, atau hubungi admin.");
    }

    const m = snap.docs[0].data();
    if (m.deletedAt) {
      throw new HttpError(404, "Tidak ditemukan. Cek lagi nomornya, atau hubungi admin.");
    }
    const namaCocok = name.length < 2 || String(m.name ?? "").toLowerCase().includes(name);
    if (!namaCocok) {
      throw new HttpError(404, "Nama dan nomor tidak cocok. Hubungi admin kalau yakin sudah terdata.");
    }

    return Response.json({ code: m.code, name: m.name });
  } catch (err) {
    return errorResponse(err);
  }
}
