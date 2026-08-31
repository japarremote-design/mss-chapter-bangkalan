import type { Metadata, Viewport } from "next";
import { SITE } from "@/lib/config";
import "./globals.css";

/**
 * URL publik situs — dipakai untuk membuat URL absolut pada tag Open Graph.
 * Vercel mengisi VERCEL_PROJECT_PRODUCTION_URL otomatis, tapi sebaiknya set
 * NEXT_PUBLIC_SITE_URL sendiri supaya domain kustom ikut terpakai.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://bangkalan-mss.vercel.app");

const title = `${SITE.name} — ${SITE.longName}`;
const description =
  "Komunitas renang syar'i khusus akhwat di Bangkalan. Lihat jadwal latihan, daftar jadi anggota, dan presensi latihan lewat QR.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE.name,
    template: `%s — ${SITE.name}`,
  },
  description,
  applicationName: SITE.name,
  keywords: [
    "MSS Bangkalan",
    "Muslimah Swimming Squad",
    "renang syar'i",
    "renang muslimah Bangkalan",
    "komunitas renang akhwat",
    "les renang Bangkalan",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "id_ID",
    url: siteUrl,
    title,
    description,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${SITE.name} — ${SITE.longName}`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f6fb0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
