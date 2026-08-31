import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Presensi Latihan",
  robots: { index: false, follow: false },
};

export default function CheckinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
