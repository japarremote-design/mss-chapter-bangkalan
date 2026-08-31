import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kartu Anggota",
  robots: { index: false, follow: false },
};

export default function KartuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
