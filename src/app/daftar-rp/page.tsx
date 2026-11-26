import Image from "next/image";
import { SITE } from "@/lib/config";
import { FormDaftarRp } from "@/components/FormDaftarRp";

export const metadata = {
  title: "Pendataan Relawan Pelatih",
  robots: { index: false, follow: false },
};

/** Halaman pendataan Relawan Pelatih (RP). Tidak dilink dari beranda; dibagikan manual. */
export default function DaftarRpPage() {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-2">
          <Image src="/logo.png" alt="Logo MSS" width={32} height={32} />
          <span className="wordmark text-sm">{SITE.name}</span>
        </div>

        <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold">Khusus Relawan Pelatih (RP)</p>
          <p className="mt-1 text-xs leading-relaxed">
            Halaman ini untuk pelatih MSS yang <b>sudah mengikuti TFT</b>. Relawan pelatih berhak
            melatih dan mengabsen saat latihan bersama. Kalau kamu peserta biasa, bukan di sini ya.
          </p>
        </div>

        <div className="mb-5 text-center">
          <h1 className="font-display text-2xl font-semibold">Pendataan Relawan Pelatih</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Isi datamu untuk mendapatkan kartu QR presensi pelatih.
          </p>
        </div>

        <FormDaftarRp />
      </div>
    </main>
  );
}
