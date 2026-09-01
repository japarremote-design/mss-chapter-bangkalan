import "server-only";
import { adminDb } from "./firebaseAdmin";

export type Settings = {
  /** Link undangan grup WhatsApp calon member. */
  waGroupCalon: string;
  /** Link undangan grup WhatsApp member. */
  waGroupMember: string;
  /** Pembuka pesan jadwal yang dikirim ke grup. */
  pesanPembuka: string;
  /** Catatan penutup pesan jadwal (perlengkapan, aturan H-2, dll). */
  pesanCatatan: string;
  /** HTM yang otomatis terisi saat membuat sesi baru. */
  htmDefault: string;
};

export const PESAN_PEMBUKA_DEFAULT = `Assalamu'alaikum, semangat pagi bunda2 semua☀

Berikut Rencana jadwal latihan bersama (Latbar) utk {JADWAL}, In syaa Allah.

Silahkan bergabung dan disesuaikan dengan waktu yang cocok nggih bunda. Segera isi list karena kuota terbatas.`;

export const PESAN_CATATAN_DEFAULT = `*Note* :
Perlengkapan yang Wajib Di Bawa untuk kelancaran saat latihan:
1. 🥽 bawa kaca mata renang
2. 🧷 6 peniti dan jika' tidak punya baju renang muslimah disarankan memakai legging dan atasan tipis + kerudung namun tetap terjaga aurat agar tidak berat di air.

Untuk yang sudah isi list, jika berhalangan hadir diharap untuk info H-2 agar slot yang kosong bisa digantikan bunda2 ya.. Semoga Allah memudahkannya 🤲🏻`;

const KOSONG: Settings = {
  waGroupCalon: "",
  waGroupMember: "",
  pesanPembuka: "",
  pesanCatatan: "",
  htmDefault: "",
};

/**
 * Pengaturan yang bisa diubah pengurus lewat panel admin.
 * Nilai di Firestore menang; env dipakai sebagai cadangan supaya pemasangan
 * lama tetap jalan tanpa harus mengisi ulang.
 */
export async function getSettings(): Promise<Settings> {
  const fallback: Settings = {
    waGroupCalon: process.env.NEXT_PUBLIC_WA_GROUP_CALON ?? "",
    waGroupMember: process.env.NEXT_PUBLIC_WA_GROUP_MEMBER ?? "",
    pesanPembuka: PESAN_PEMBUKA_DEFAULT,
    pesanCatatan: PESAN_CATATAN_DEFAULT,
    htmDefault: "10000 + Infaq Terbaik",
  };

  try {
    const snap = await adminDb().collection("config").doc("umum").get();
    if (!snap.exists) return fallback;
    const d = snap.data() ?? {};
    return {
      waGroupCalon: (d.waGroupCalon ?? "").trim() || fallback.waGroupCalon,
      waGroupMember: (d.waGroupMember ?? "").trim() || fallback.waGroupMember,
      pesanPembuka: (d.pesanPembuka ?? "").trim() || fallback.pesanPembuka,
      pesanCatatan: (d.pesanCatatan ?? "").trim() || fallback.pesanCatatan,
      htmDefault: (d.htmDefault ?? "").trim() || fallback.htmDefault,
    };
  } catch {
    return fallback;
  }
}

export async function saveSettings(patch: Partial<Settings>, by: string): Promise<Settings> {
  const bersih: Settings = { ...KOSONG };
  for (const k of [
    "waGroupCalon",
    "waGroupMember",
    "pesanPembuka",
    "pesanCatatan",
    "htmDefault",
  ] as const) {
    bersih[k] = String(patch[k] ?? "").trim();
  }
  await adminDb()
    .collection("config")
    .doc("umum")
    .set({ ...bersih, updatedAt: new Date().toISOString(), updatedBy: by });
  return getSettings();
}

/** Link undangan WhatsApp yang sah, atau string kosong. */
export function validasiLinkGrup(v: string): string {
  const s = v.trim();
  if (!s) return "";
  if (!/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+/.test(s)) {
    throw new Error(
      "Link grup harus berbentuk https://chat.whatsapp.com/… — ambil dari WhatsApp: Info grup → Undang lewat tautan."
    );
  }
  return s;
}
