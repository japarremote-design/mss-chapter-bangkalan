import Image from "next/image";
import Link from "next/link";
import { FormDaftar } from "@/components/FormDaftar";
import { SITE } from "@/lib/config";

export const metadata = { title: "Daftar Calon Member — MSS Chapter Bangkalan" };

export default function DaftarPage() {
  return (
    <main className="wave-top min-h-screen px-5 py-10">
      <div className="mx-auto max-w-md">
        <Link href="/" className="mb-6 inline-flex items-center gap-2">
          <Image src="/logo.png" alt="Logo MSS" width={48} height={48} priority />
          <span className="wordmark text-sm">{SITE.name}</span>
        </Link>

        <h1 className="wordmark text-2xl">Gabung Skuad</h1>
        <p className="mt-1 mb-5 text-sm text-[var(--muted)]">
          Terbuka untuk muslimah usia 15 tahun ke atas — sekitar 2 menit, dibagi 3 langkah.
        </p>

        <FormDaftar />

        <Link href="/" className="mt-6 inline-block text-sm text-[var(--accent)]">
          ← Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
