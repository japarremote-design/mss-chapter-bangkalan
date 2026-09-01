import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pendataan MSS Pusat",
  robots: { index: false, follow: false },
};

export default function PusatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
