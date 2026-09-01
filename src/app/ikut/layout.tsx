import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar Ikut Latihan",
  robots: { index: false, follow: false },
};

export default function IkutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
