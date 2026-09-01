/**
 * Konten statis situs — ubah di sini, semua halaman ikut.
 */

export const SITE = {
  name: "MSS Chapter Bangkalan",
  longName: "Muslimah Swimming Squad",
  tagline:
    "Wadah renang syar'i khusus akhwat. Berenang sehat, nyaman, gratis, cukup bayar pakai doa!",
};

export type AdminContact = {
  /** Nomor WhatsApp format internasional tanpa +, mis. 6281804514215 */
  phone: string;
  name: string;
  role: string;
};

export const ADMIN_CONTACTS: AdminContact[] = [
  { phone: "6287849377554", name: "Eka", role: "Admin 1" },
  { phone: "6287750767647", name: "Andriana", role: "Admin 2" },
];

/**
 * Link undangan grup WhatsApp. Diisi lewat environment variable supaya bisa
 * diganti tanpa menyentuh kode (link undangan WA bisa di-reset kapan saja).
 * Kalau kosong, tombolnya otomatis tidak ditampilkan.
 */
export const WA_GROUPS = {
  calon: {
    label: "Grup WhatsApp Calon Member",
    url: process.env.NEXT_PUBLIC_WA_GROUP_CALON ?? "",
  },
  member: {
    label: "Grup WhatsApp Member",
    url: process.env.NEXT_PUBLIC_WA_GROUP_MEMBER ?? "",
  },
};

export const SOCIALS = [
  {
    key: "instagram",
    label: "Instagram",
    handle: "@muslimahswimmingsquadbangkalan",
    url: "https://www.instagram.com/muslimahswimmingsquadbangkalan",
  },
  {
    key: "facebook",
    label: "Facebook Utama",
    handle: "Halaman Resmi MSS",
    url: "https://www.facebook.com/profile.php?id=61552969102657",
  },
  {
    key: "facebook",
    label: "Facebook Komunitas",
    handle: "Grup Skuad Bangkalan",
    url: "https://www.facebook.com/profile.php?id=61552466652504",
  },
  {
    key: "youtube",
    label: "YouTube",
    handle: "@MSSBangkalan",
    url: "https://www.youtube.com/@MSSBangkalan",
  },
] as const;

export const KEUNGGULAN = [
  {
    icon: "lock",
    title: "Aurat Aman & Terjaga",
    body: "Kolam khusus atau waktu tertutup yang didesain ketat agar bebas dari jangkauan non-mahram.",
  },
  {
    icon: "swim",
    title: "Materi Lengkap",
    body: "Latihan dari nol: teknik dasar gaya dada, pernapasan, hingga mitigasi keadaan darurat (Uitemate).",
  },
  {
    icon: "users",
    title: "Ukhuwah Akhwat",
    body: "Menambah relasi positif sesama muslimah di Bangkalan dalam lingkungan yang suportif.",
  },
];

export function waLink(phone: string, text: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
