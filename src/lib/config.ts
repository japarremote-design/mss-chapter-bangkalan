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
  { phone: "6281804514215", name: "Admin Aan", role: "Chapter 1" },
  { phone: "6287750767647", name: "Admin Andriana", role: "Chapter 2" },
];

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
