"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdmin } from "@/components/useAdmin";
import { useGrupWa } from "@/components/useGrupWa";
import type { TrainingSession, Week } from "@/lib/types";

export default function SesiPage() {
  return (
    <AdminShell>
      <Sesi />
    </AdminShell>
  );
}

type WeekFull = Week & { token: string; sessions: TrainingSession[] };
type Baris = {
  title: string;
  date: string;
  startTime: string;
  location: string;
  quota: string;
  coach: string;
};

const HARI = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function tanggalIndo(s: string) {
  const d = new Date(`${s}T00:00:00`);
  if (Number.isNaN(d.getTime())) return s;
  return `${HARI[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
}

/** Baris kosong default: dua sesi di akhir pekan terdekat. */
function barisAwal(): Baris[] {
  const now = new Date();
  const sabtu = new Date(now);
  sabtu.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7 || 7));
  const ahad = new Date(sabtu);
  ahad.setDate(sabtu.getDate() + 1);
  return [
    {
      title: "Latihan Rutin",
      date: iso(sabtu),
      startTime: "07.00 - 09.00",
      location: "",
      quota: "",
      coach: "",
    },
    {
      title: "Latihan Rutin",
      date: iso(ahad),
      startTime: "07.00 - 09.00",
      location: "",
      quota: "",
      coach: "",
    },
  ];
}

function Sesi() {
  const { user, api } = useAdmin();
  const [weeks, setWeeks] = useState<WeekFull[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("");
  const [rows, setRows] = useState<Baris[]>(barisAwal);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState("");
  const [info, setInfo] = useState("");
  const grup = useGrupWa();

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    if (!user) return;
    api<{ weeks: WeekFull[] }>("/api/admin/weeks")
      .then((d) => setWeeks(d.weeks))
      .catch((e) => setError(e.message));
  }, [user, api]);

  async function buat(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const hasil = await api<{ digabung?: string[] }>("/api/admin/weeks", {
        method: "POST",
        body: JSON.stringify({
          label,
          sessions: rows.map((r) => ({ ...r, quota: r.quota ? Number(r.quota) : 0 })),
        }),
      });
      setInfo(
        hasil.digabung && hasil.digabung.length > 0
          ? `Slot yang sama persis digabung jadi satu latihan: ${hasil.digabung.join(", ")}. Nama relawan pelatih ditambahkan ke sesi yang sudah ada.`
          : ""
      );
      const d = await api<{ weeks: WeekFull[] }>("/api/admin/weeks");
      setWeeks(d.weeks);
      setRows(barisAwal());
      setLabel("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function linkIkut(w: WeekFull) {
    return `${origin}/ikut/${w.id}?k=${w.token}`;
  }

  function pesanWa(w: WeekFull) {
    const daftar = w.sessions
      .map(
        (s) =>
          `• ${tanggalIndo(s.date)}${s.startTime ? ` ${s.startTime}` : ""}${
            s.location ? ` — ${s.location}` : ""
          }`
      )
      .join("\n");
    return encodeURIComponent(
      `Assalamualaikum akhwat MSS Bangkalan 🏊‍♀️\n\nJadwal latihan minggu ini:\n${daftar}\n\n` +
        `Yang mau ikut, silakan ngelist lewat link ini ya:\n${linkIkut(w)}\n\n` +
        `Catatan: presensi di kolam hanya untuk yang sudah ngelist. Syukron!`
    );
  }

  async function salin(w: WeekFull) {
    try {
      await navigator.clipboard.writeText(linkIkut(w));
      setCopied(w.id);
      setTimeout(() => setCopied(""), 2000);
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold">Jadwal Mingguan &amp; Sesi Latihan</h1>
        <p className="text-xs text-[var(--muted)]">
          Tiap Senin: buat jadwal seminggu di bawah, lalu share linknya ke grup WhatsApp.
        </p>
      </div>

      <form onSubmit={buat} className="panel space-y-3 p-4">
        <div>
          <label className="label">Judul paket jadwal (opsional)</label>
          <input
            className="field"
            placeholder="mis. Jadwal Latihan Pekan Ini"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-12">
              <input
                type="date"
                required
                className="field sm:col-span-2"
                value={r.date}
                onChange={(e) =>
                  setRows(rows.map((x, j) => (i === j ? { ...x, date: e.target.value } : x)))
                }
              />
              <input
                className="field sm:col-span-3"
                placeholder="Jam, mis. 07.00 - 09.00"
                value={r.startTime}
                onChange={(e) =>
                  setRows(rows.map((x, j) => (i === j ? { ...x, startTime: e.target.value } : x)))
                }
              />
              <input
                className="field sm:col-span-3"
                placeholder="Kolam"
                value={r.location}
                onChange={(e) =>
                  setRows(rows.map((x, j) => (i === j ? { ...x, location: e.target.value } : x)))
                }
              />
              <input
                className="field sm:col-span-2"
                placeholder="Relawan pelatih"
                value={r.coach}
                onChange={(e) =>
                  setRows(rows.map((x, j) => (i === j ? { ...x, coach: e.target.value } : x)))
                }
              />
              <input
                className="field sm:col-span-1"
                placeholder="Kuota"
                inputMode="numeric"
                value={r.quota}
                onChange={(e) =>
                  setRows(rows.map((x, j) => (i === j ? { ...x, quota: e.target.value } : x)))
                }
              />
              <button
                type="button"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
                className="btn btn-ghost px-2 py-1 text-xs sm:col-span-1"
                disabled={rows.length === 1}
              >
                Hapus
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setRows([
                ...rows,
                { title: "Latihan Rutin", date: "", startTime: "", location: "", quota: "", coach: "" },
              ])
            }
            className="btn btn-ghost"
          >
            + Tambah sesi
          </button>
          <button disabled={busy} className="btn btn-primary ml-auto">
            {busy ? "Menyimpan…" : "Buat jadwal & dapatkan link"}
          </button>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Kuota dikosongkan = tanpa batas peserta. Kalau tanggal, jam, dan kolamnya sama persis
          dengan sesi yang sudah ada, sistem menganggapnya satu latihan dan hanya menambahkan nama
          pelatihnya.
        </p>
      </form>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {info && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          {info}
        </p>
      )}

      <div className="space-y-4">
        {weeks.map((w) => (
          <div key={w.id} className="panel p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="font-bold">{w.label}</h2>
              <span className="text-xs text-[var(--muted)]">{w.sessions.length} sesi</span>
              <div className="ml-auto flex gap-2">
                <button onClick={() => salin(w)} className="btn btn-ghost px-3 py-1 text-xs">
                  {copied === w.id ? "Tersalin ✓" : "Salin link"}
                </button>
                <a
                  href={`https://wa.me/?text=${pesanWa(w)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary px-3 py-1 text-xs"
                >
                  Share ke WhatsApp
                </a>
              </div>
            </div>

            <p className="mb-2 break-all rounded-lg bg-[var(--accent-soft)] p-2 font-mono text-xs">
              {linkIkut(w)}
            </p>
            <p className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
              Share link ini ke dua grup — calon member &amp; member.
              {grup.calon && (
                <a
                  href={grup.calon}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)]"
                >
                  Buka grup calon
                </a>
              )}
              {grup.member && (
                <a
                  href={grup.member}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)]"
                >
                  Buka grup member
                </a>
              )}
            </p>

            <ul className="divide-y divide-[var(--line)]">
              {w.sessions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/admin/sesi/${s.id}`} className="font-medium">
                      {tanggalIndo(s.date)}
                      {s.startTime ? ` · ${s.startTime}` : ""}
                    </Link>
                    <p className="text-xs text-[var(--muted)]">
                      {s.location || s.title}
                      {s.coaches.length > 0 ? ` · ${s.coaches.join(" & ")}` : ""}
                    </p>
                  </div>
                  <span className="ml-auto text-sm">
                    <b>{s.rsvpCount}</b>
                    <span className="text-[var(--muted)]"> ikut</span>
                    {s.quota > 0 && <span className="text-[var(--muted)]">/{s.quota}</span>}
                    <span className="text-[var(--muted)]"> · {s.attendeeCount} hadir</span>
                  </span>
                  <Link href={`/admin/sesi/${s.id}`} className="btn btn-primary px-3 py-1 text-xs">
                    Layar QR
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {weeks.length === 0 && (
          <p className="panel p-6 text-center text-sm text-[var(--muted)]">
            Belum ada jadwal mingguan.
          </p>
        )}
      </div>
    </div>
  );
}
