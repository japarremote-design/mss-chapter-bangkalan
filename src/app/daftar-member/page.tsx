import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/config";
import { FormDaftarMember } from "@/components/FormDaftarMember";

export const metadata = {
  title: "Pendataan Ulang Member",
  robots: { index: false, follow: false },
};

/**
 * Halaman khusus MEMBER LAMA mendata ulang dirinya setelah database direset
 * — bukan formulir pendaftaran calon member baru. Sengaja tidak dilink dari
 * beranda/navigasi; bagikan URL-nya manual ke member lewat WhatsApp.
 */
export default function DaftarMemberPage() {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-2">
          <Image src="/logo.png" alt="Logo MSS" width={32} height={32} />
          <span className="wordmark text-sm">{SITE.name}</span>
        </div>

        <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold">Khusus member lama MSS</p>
          <p className="mt-1 text-xs leading-relaxed">
            Halaman ini untuk kamu yang <b>sudah lama ikut latihan MSS</b> dan diminta pengurus
            mendata ulang dirinya setelah sistem baru ini dipakai. Kalau kamu belum pernah ikut
            latihan sama sekali, isi{" "}
            <Link href="/#daftar" className="font-semibold underline underline-offset-2">
              formulir pendaftaran calon member
            </Link>{" "}
            di beranda ya, bukan di sini.
          </p>
        </div>

        <div className="mb-5 text-center">
          <h1 className="font-display text-2xl font-semibold">Pendataan Ulang Member</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Isi data dirimu sekali lagi — statusmu tetap <b>member</b>, tidak perlu menunggu
            verifikasi pengurus.
          </p>
        </div>

        <FormDaftarMember />
      </div>
    </main>
  );
}
