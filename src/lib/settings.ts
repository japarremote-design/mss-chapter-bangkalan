import "server-only";
import { adminDb } from "./firebaseAdmin";

export type Settings = {
  /** Link undangan grup WhatsApp calon member. */
  waGroupCalon: string;
  /** Link undangan grup WhatsApp member. */
  waGroupMember: string;
};

const KOSONG: Settings = { waGroupCalon: "", waGroupMember: "" };

/**
 * Pengaturan yang bisa diubah pengurus lewat panel admin.
 * Nilai di Firestore menang; env dipakai sebagai cadangan supaya pemasangan
 * lama tetap jalan tanpa harus mengisi ulang.
 */
export async function getSettings(): Promise<Settings> {
  const fallback: Settings = {
    waGroupCalon: process.env.NEXT_PUBLIC_WA_GROUP_CALON ?? "",
    waGroupMember: process.env.NEXT_PUBLIC_WA_GROUP_MEMBER ?? "",
  };

  try {
    const snap = await adminDb().collection("config").doc("umum").get();
    if (!snap.exists) return fallback;
    const d = snap.data() ?? {};
    return {
      waGroupCalon: (d.waGroupCalon ?? "").trim() || fallback.waGroupCalon,
      waGroupMember: (d.waGroupMember ?? "").trim() || fallback.waGroupMember,
    };
  } catch {
    return fallback;
  }
}

export async function saveSettings(patch: Partial<Settings>, by: string): Promise<Settings> {
  const bersih: Settings = { ...KOSONG };
  for (const k of ["waGroupCalon", "waGroupMember"] as const) {
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
