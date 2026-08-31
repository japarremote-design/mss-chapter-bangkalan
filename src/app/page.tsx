import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="wave-top min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-12">
        <Image
          src="/logo.png"
          alt="Logo Muslimah Swimming Squad"
          width={104}
          height={104}
          priority
          className="mb-5"
        />
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent)]">
          Chapter Bangkalan
        </p>
        <h1 className="wordmark mt-2 text-3xl sm:text-4xl">Muslimah Swimming Squad</h1>
        <p className="mt-4 max-w-md text-[var(--muted)]">
          Sistem keanggotaan dan presensi latihan renang. Presensi dilakukan dengan memindai QR yang
          ditampilkan pengurus di lokasi latihan.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/daftar" className="btn btn-primary">
            Daftar jadi calon anggota
          </Link>
          <Link href="/admin" className="btn btn-ghost">
            Masuk pengurus
          </Link>
        </div>

        <div className="panel mt-10 p-5 text-sm text-[var(--muted)]">
          <p className="mb-2 font-semibold text-[var(--ink)]">Cara presensi</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Datang ke lokasi latihan.</li>
            <li>Scan QR di layar pengurus pakai kamera HP.</li>
            <li>Pilih namamu, lalu tekan tombol hadir.</li>
          </ol>
          <p className="mt-3">
            Status <b className="text-[var(--ink)]">calon anggota</b> naik otomatis menjadi{" "}
            <b className="text-[var(--ink)]">anggota</b> setelah kehadiran latihan pertama tercatat.
          </p>
        </div>
      </div>
    </main>
  );
}
