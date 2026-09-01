import "server-only";
import { adminDb } from "./firebaseAdmin";
import type { Member, PusatConfig, PusatEntry } from "./types";

/**
 * Sambungan ke formulir Google milik MSS Pusat.
 *
 * Formulir pusat bisa berubah sewaktu-waktu, jadi tidak ada ID pertanyaan yang
 * ditanam di kode. Admin menempelkan "tautan isian otomatis" (pre-filled link)
 * dari Google Form, lalu memasangkan tiap pertanyaan dengan isian di app ini.
 */

export const FIELD_OPTIONS: { key: string; label: string }[] = [
  { key: "", label: "— tidak dikirim —" },
  { key: "name", label: "Nama lengkap" },
  { key: "nickname", label: "Nama panggilan" },
  { key: "address", label: "Alamat domisili" },
  { key: "district", label: "Kecamatan" },
  { key: "city", label: "Kabupaten/Kota" },
  { key: "province", label: "Provinsi" },
  { key: "birthDate", label: "Tanggal lahir" },
  { key: "birthPlace", label: "Tempat lahir" },
  { key: "phone", label: "No. HP (WhatsApp)" },
  { key: "chapter", label: "Chapter MSS (selalu \"Bangkalan\")" },
  { key: "age", label: "Usia" },
  { key: "gender", label: "Jenis kelamin" },
  { key: "job", label: "Pekerjaan" },
  { key: "religion", label: "Agama" },
  { key: "maritalStatus", label: "Status pernikahan" },
  { key: "code", label: "Kode member MSS Bangkalan" },
];

/** Isian yang wajib ada sebelum member bisa mengirim ke pusat. */
export const FIELD_TAMBAHAN = ["birthPlace", "birthDate", "district", "city", "province"] as const;

export async function getPusatConfig(): Promise<PusatConfig | null> {
  const snap = await adminDb().collection("config").doc("pusat").get();
  if (!snap.exists) return null;
  const d = snap.data() ?? {};
  return {
    formUrl: d.formUrl ?? "",
    entries: Array.isArray(d.entries) ? (d.entries as PusatEntry[]) : [],
    updatedAt: d.updatedAt ?? "",
    updatedBy: d.updatedBy ?? "",
  };
}

/**
 * Baca tautan isian otomatis Google Form dan ambil daftar pertanyaannya.
 * Pertanyaan tanggal muncul sebagai entry.123_year/_month/_day — digabung
 * kembali jadi satu entri bertipe "date".
 */
export function parsePrefillUrl(raw: string): { formUrl: string; entries: PusatEntry[] } {
  const url = new URL(raw.trim());
  if (!/^docs\.google\.com$/i.test(url.hostname)) {
    throw new Error("Tautan harus dari docs.google.com.");
  }

  const formUrl = `${url.origin}${url.pathname.replace(/\/(viewform|formResponse).*$/, "/viewform")}`;

  const map = new Map<string, PusatEntry>();
  url.searchParams.forEach((value, key) => {
    const m = key.match(/^entry\.(\d+)(_year|_month|_day|_hour|_minute)?$/);
    if (!m) return;
    const id = m[1];
    const isDate = Boolean(m[2]);
    const ada = map.get(id);
    if (ada) {
      if (isDate) ada.type = "date";
      if (!ada.sample && value) ada.sample = value;
      return;
    }
    map.set(id, {
      entryId: id,
      type: isDate ? "date" : "text",
      sample: value,
      field: "",
    });
  });

  const entries = [...map.values()];
  if (entries.length === 0) {
    throw new Error(
      "Tidak ada pertanyaan yang terbaca. Pastikan yang ditempel adalah tautan isian otomatis (pre-filled link), bukan tautan biasa."
    );
  }
  return { formUrl, entries };
}

function nilaiIsian(member: Member, field: string): string {
  if (field === "chapter") return "Bangkalan";
  const v = (member as unknown as Record<string, unknown>)[field];
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

/** Susun URL formulir pusat yang sudah terisi data member. */
export function buildPrefillUrl(config: PusatConfig, member: Member): string {
  const url = new URL(config.formUrl);
  url.searchParams.set("usp", "pp_url");

  for (const e of config.entries) {
    if (!e.field) continue;
    const nilai = nilaiIsian(member, e.field).trim();
    if (!nilai) continue;

    if (e.type === "date") {
      const m = nilai.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) continue;
      url.searchParams.set(`entry.${e.entryId}_year`, m[1]);
      url.searchParams.set(`entry.${e.entryId}_month`, String(Number(m[2])));
      url.searchParams.set(`entry.${e.entryId}_day`, String(Number(m[3])));
    } else {
      url.searchParams.set(`entry.${e.entryId}`, nilai);
    }
  }
  return url.toString();
}

/** Isian pusat yang masih kosong pada data member. */
export function isianKurang(config: PusatConfig, member: Member): string[] {
  const dipakai = new Set(config.entries.map((e) => e.field).filter(Boolean));
  return FIELD_TAMBAHAN.filter(
    (f) => dipakai.has(f) && !String(nilaiIsian(member, f)).trim()
  );
}
