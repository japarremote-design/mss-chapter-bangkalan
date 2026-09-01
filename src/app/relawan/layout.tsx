import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Layar Relawan Pelatih",
  robots: { index: false, follow: false },
};

export default function RelawanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
