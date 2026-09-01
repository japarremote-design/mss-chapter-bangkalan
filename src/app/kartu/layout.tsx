import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kartu Member",
  robots: { index: false, follow: false },
};

export default function KartuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
