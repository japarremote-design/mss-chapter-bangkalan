import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-12">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent)]">
        Chapter Bangkalan
      </p>
      <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">MSS</h1>
      <p className="mt-4 max-w-md text-[var(--muted)]">
        Sistem keanggotaan dan presensi latihan. Presensi dilakukan dengan memindai QR yang
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
          Status <b>calon anggota</b> naik otomatis menjadi <b>anggota</b> setelah kehadiran latihan
          pertama tercatat.
        </p>
      </div>
    </main>
  );
}
