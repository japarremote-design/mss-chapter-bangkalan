import Image from "next/image";
import Link from "next/link";
import { listSchedules } from "@/lib/data";
import { ADMIN_CONTACTS, KEUNGGULAN, SITE, SOCIALS, waLink } from "@/lib/config";
import { FeatureIcon, IconWhatsapp, SocialIcon } from "@/components/Icons";
import { FormDaftar } from "@/components/FormDaftar";
import type { Schedule } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  let schedules: Schedule[] = [];
  let scheduleError = false;
  try {
    schedules = await listSchedules();
  } catch {
    scheduleError = true;
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <Keunggulan />
      <Sosmed />
      <Jadwal schedules={schedules} error={scheduleError} />
      <Daftar />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--panel)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-3 sm:flex-row sm:gap-0">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Logo MSS" width={34} height={34} priority />
          <span className="wordmark text-sm sm:text-base">MSS Chapter Bangkalan</span>
        </Link>
        <div className="flex items-center gap-3 text-xs font-medium sm:ml-auto sm:text-sm">
          <a href="#sosmed" className="text-[var(--muted)] hover:text-[var(--accent)]">
            Sosmed
          </a>
          <a href="#jadwal" className="text-[var(--muted)] hover:text-[var(--accent)]">
            Jadwal
          </a>
          <a href="#daftar" className="btn btn-primary px-3 py-1.5 text-xs">
            Gabung
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-[#0f6fb0] via-[#1f86c4] to-[#12468f] px-4 py-16 text-center text-white sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full border-4 border-white/70 bg-white/95 p-1 shadow-xl">
            <Image src="/logo.png" alt="Logo MSS" width={96} height={96} priority />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{SITE.name}</h1>
        <p className="mx-auto mt-4 max-w-xl text-base opacity-95 sm:text-lg">{SITE.tagline}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#daftar"
            className="rounded-full bg-white px-7 py-3 font-bold text-[var(--deep)] shadow-lg transition hover:scale-105"
          >
            Daftar Sekarang
          </a>
          <a
            href="#sosmed"
            className="rounded-full border border-white/50 bg-white/15 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/25"
          >
            Cek Media Sosial
          </a>
        </div>
      </div>
    </header>
  );
}

function Keunggulan() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-14 text-center">
      <h2 className="text-2xl font-bold sm:text-3xl">Mengapa Harus Gabung Skuad?</h2>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {KEUNGGULAN.map((k) => (
          <div key={k.title} className="panel p-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              <FeatureIcon kind={k.icon} />
            </div>
            <h3 className="mb-2 font-bold">{k.title}</h3>
            <p className="text-sm text-[var(--muted)]">{k.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Sosmed() {
  return (
    <section id="sosmed" className="scroll-mt-20 bg-[#e8f4fc] py-14">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Media Sosial Resmi Kami</h2>
        <p className="mt-2 text-[var(--muted)]">
          Intip dokumentasi kegiatan kami dan edukasi renang terkini.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SOCIALS.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="panel group flex flex-col items-center p-6 transition hover:-translate-y-0.5"
            >
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white transition group-hover:scale-110">
                <SocialIcon kind={s.key} className="h-7 w-7" />
              </div>
              <span className="font-bold">{s.label}</span>
              <span className="mt-1 break-all text-xs text-[var(--muted)]">{s.handle}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Jadwal({ schedules, error }: { schedules: Schedule[]; error: boolean }) {
  return (
    <section id="jadwal" className="scroll-mt-20 py-14">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Jadwal Latihan Rutin</h2>
        <p className="mt-2 text-[var(--muted)]">
          Data di bawah ini diambil langsung dari database pengurus.
        </p>

        <div className="panel mt-8 overflow-x-auto text-left">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--accent)] text-xs uppercase tracking-wide text-white">
                <th className="p-4 text-left">Hari</th>
                <th className="p-4 text-left">Jam</th>
                <th className="p-4 text-left">Lokasi Kolam</th>
                <th className="p-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id} className="border-b border-[var(--line)] last:border-0">
                  <td className="p-4 font-medium">{s.day || "-"}</td>
                  <td className="p-4">{s.time || "-"}</td>
                  <td className="p-4">{s.pool || "-"}</td>
                  <td className="p-4">
                    <span className={`badge ${s.status === "Penuh" ? "badge-calon" : "badge-member"}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-[var(--muted)]">
                    {error
                      ? "Jadwal belum bisa dimuat saat ini."
                      : "Belum ada jadwal latihan terdaftar."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Daftar() {
  return (
    <section id="daftar" className="scroll-mt-20 bg-[#e8f4fc] py-14">
      <div className="mx-auto max-w-lg px-4">
        <div className="mb-5 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Gabung Skuad</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Terbuka untuk muslimah usia 15 tahun ke atas — sekitar 2 menit, dibagi 3 langkah.
          </p>
        </div>

        <FormDaftar />

        <div className="mt-6">
          <h3 className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Tanya langsung ke admin
          </h3>
          <div className="space-y-3">
            {ADMIN_CONTACTS.map((a) => (
              <a
                key={a.phone}
                href={waLink(
                  a.phone,
                  `Assalamualaikum Admin ${a.name}, saya ingin tanya seputar pendaftaran MSS Chapter Bangkalan...`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="panel flex items-center gap-3 p-3 transition hover:bg-[var(--accent-soft)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white">
                  <IconWhatsapp className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">
                    Admin {a.name} <span className="font-normal text-[var(--muted)]">({a.role})</span>
                  </span>
                  <span className="block text-xs text-[var(--muted)]">
                    Fast response tanya &amp; konsultasi
                  </span>
                </span>
                <span className="ml-auto shrink-0 text-xs font-bold text-[var(--accent)]">
                  Hubungi
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#0d2438] px-4 py-10 text-center text-xs text-slate-400">
      <div className="mb-5 flex justify-center gap-5">
        {SOCIALS.map((s) => (
          <a
            key={s.url}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="text-slate-400 transition hover:text-white"
          >
            <SocialIcon kind={s.key} className="h-5 w-5" />
          </a>
        ))}
      </div>
      <p>
        © {new Date().getFullYear()} {SITE.name}. Hak cipta dilindungi.
      </p>
      <p className="mt-2">
        Powered by{" "}
        <a
          href="https://qfazdigital.my.id"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-slate-300 underline decoration-slate-600 underline-offset-2 transition hover:text-white"
        >
          Qfaz Digital
        </a>
      </p>
      <Link href="/admin" className="mt-3 inline-block text-slate-500 hover:text-slate-300">
        Masuk pengurus
      </Link>
    </footer>
  );
}
