import Image from "next/image";
import Link from "next/link";
import { listSchedules } from "@/lib/data";
import { ADMIN_CONTACTS, KEUNGGULAN, SITE, SOCIALS, waLink } from "@/lib/config";
import { FeatureIcon, IconWhatsapp, SocialIcon } from "@/components/Icons";
import { FormDaftar } from "@/components/FormDaftar";
import { FabWa } from "@/components/FabWa";
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
      <FabWa />
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
    <header className="relative overflow-hidden bg-gradient-to-b from-[#12468f] to-[#0f6fb0] px-4 pb-0 pt-14 text-white sm:pt-20">
      <div className="mx-auto grid max-w-5xl items-center gap-10 sm:px-4 md:grid-cols-[1.15fr_0.85fr] md:gap-6">
        <div className="text-center md:text-left">
          <p className="font-display text-sm italic tracking-wide text-[#aee0ff] md:text-base">
            Bangkalan, Jawa Timur
          </p>
          <h1 className="font-display mt-2 text-4xl font-semibold leading-[1.08] sm:text-5xl md:text-[3.2rem]">
            {SITE.name}
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[0.95rem] leading-relaxed text-white/85 sm:text-base md:mx-0">
            {SITE.tagline}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 md:items-start">
            <a
              href="#daftar"
              className="rounded-xl bg-white px-7 py-3 font-bold text-[var(--deep)] shadow-[0_10px_24px_rgba(5,25,46,0.25)] transition hover:bg-[#f3fbff]"
            >
              Daftar Sekarang
            </a>
            <a
              href="#sosmed"
              className="text-sm font-semibold text-white/80 underline decoration-white/30 underline-offset-4 transition hover:text-white"
            >
              Lihat dokumentasi kegiatan kami →
            </a>
          </div>
        </div>

        <div className="relative mx-auto hidden h-64 w-64 place-items-center md:grid">
          <div className="absolute h-56 w-56 rounded-[40%_60%_55%_45%/50%_45%_55%_50%] bg-white/10" />
          <div className="absolute h-44 w-44 translate-x-6 translate-y-4 rounded-[55%_45%_50%_50%/45%_55%_45%_55%] bg-[#34a7dd]/30" />
          <div className="relative rounded-full border-4 border-white/80 bg-white p-2 shadow-2xl">
            <Image src="/logo.png" alt="Logo MSS" width={120} height={120} priority />
          </div>
        </div>
      </div>

      <svg
        className="wave-divider mt-12 text-[var(--bg)] sm:mt-16"
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0,32 C180,60 360,4 600,20 C840,36 1020,58 1200,24 L1200,60 L0,60 Z"
        />
      </svg>
    </header>
  );
}

function Keunggulan() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
          Kenapa gabung
        </p>
        <h2 className="font-display mt-2 text-2xl font-semibold sm:text-3xl">
          Alasan muslimah Bangkalan memilih Skuad
        </h2>
      </div>
      <div className="mt-10 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {KEUNGGULAN.map((k, i) => (
          <div key={k.title} className="flex gap-5 py-6 sm:gap-7">
            <span className="font-display shrink-0 text-3xl font-semibold text-[var(--line)] sm:text-4xl">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-[var(--accent)]">
                <FeatureIcon kind={k.icon} />
                <h3 className="font-bold text-[var(--ink)]">{k.title}</h3>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{k.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Sosmed() {
  return (
    <section id="sosmed" className="scroll-mt-20 bg-[#e8f4fc] py-14">
      <div className="mx-auto max-w-2xl px-4">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            Ikuti kami
          </p>
          <h2 className="font-display mt-2 text-2xl font-semibold sm:text-3xl">
            Media Sosial Resmi
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Dokumentasi kegiatan dan edukasi renang terkini.
          </p>
        </div>
        <div className="panel mt-8 divide-y divide-[var(--line)]">
          {SOCIALS.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 p-4 transition first:rounded-t-[16px] last:rounded-b-[16px] hover:bg-[var(--accent-soft)]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                <SocialIcon kind={s.key} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{s.label}</span>
                <span className="block truncate text-xs text-[var(--muted)]">{s.handle}</span>
              </span>
              <span className="shrink-0 text-[var(--muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent)]">
                →
              </span>
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
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">Jadwal Latihan Rutin</h2>
        <p className="mt-2 text-[var(--muted)]">
          Dibuka tiap minggu oleh pengurus — kuota terbatas, jadi cek rutin ya.
        </p>

        <div className="panel mt-8 overflow-x-auto text-left">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[var(--accent-soft)] text-xs uppercase tracking-wide text-[var(--muted)]">
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
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">Gabung Skuad</h2>
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
