"use client";

import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

type Sesi = {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  location?: string;
  quota: number;
  rsvpCount: number;
  open: boolean;
  full: boolean;
};
type Week = { id: string; label: string; open: boolean };
type Kandidat = { id: string; name: string; status: "calon" | "member" };

const HARI = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function tanggalIndo(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${HARI[d.getDay()]}, ${d.getDate()} ${d.toLocaleDateString("id-ID", { month: "long" })}`;
}

export default function IkutPage() {
  return (
    <Suspense fallback={<Center>Memuat…</Center>}>
      <Ikut />
    </Suspense>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 text-sm text-[var(--muted)]">
      {children}
    </main>
  );
}

function Ikut() {
  const { id: weekId } = useParams<{ id: string }>();
  const token = useSearchParams().get("k") ?? "";

  const [week, setWeek] = useState<Week | null>(null);
  const [sessions, setSessions] = useState<Sesi[]>([]);
  const [joined, setJoined] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  // Siapa saya — disimpan di HP supaya tidak perlu cari nama tiap buka link.
  const [me, setMe] = useState<{ id: string; name: string } | null>(null);
  const [q, setQ] = useState("");
  const [kandidat, setKandidat] = useState<Kandidat[]>([]);
  const [modeBaru, setModeBaru] = useState(false);
  const [baru, setBaru] = useState({ name: "", phone: "" });

  const post = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/public/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekId, token, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Terjadi kesalahan.");
      return data;
    },
    [weekId, token]
  );

  const muatSesi = useCallback(() => {
    fetch(`/api/public/week/${weekId}?k=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setWeek(d.week);
        setSessions(d.sessions);
      })
      .catch((e) => setError(e.message));
  }, [weekId, token]);

  useEffect(() => {
    muatSesi();
    try {
      const saved = localStorage.getItem("mss-me");
      if (saved) setMe(JSON.parse(saved));
    } catch {}
  }, [muatSesi]);

  // Sesi mana yang sudah diikuti orang ini
  useEffect(() => {
    if (!me) return;
    fetch(
      `/api/public/rsvp?weekId=${weekId}&memberId=${me.id}&k=${encodeURIComponent(token)}`
    )
      .then((r) => r.json())
      .then((d) => setJoined(d.joined ?? []))
      .catch(() => {});
  }, [me, weekId, token]);

  // Pencarian nama
  useEffect(() => {
    if (q.trim().length < 2) {
      setKandidat([]);
      return;
    }
    const t = setTimeout(() => {
      post({ action: "cari", q })
        .then((d) => setKandidat(d.members ?? []))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q, post]);

  function pilihSaya(m: { id: string; name: string }) {
    setMe(m);
    try {
      localStorage.setItem("mss-me", JSON.stringify(m));
    } catch {}
    setQ("");
    setKandidat([]);
  }

  async function toggle(s: Sesi) {
    if (!me) return;
    setBusyId(s.id);
    setError("");
    const sudah = joined.includes(s.id);
    try {
      await post({ action: sudah ? "batal" : "ikut", sessionId: s.id, memberId: me.id });
      setJoined((prev) => (sudah ? prev.filter((x) => x !== s.id) : [...prev, s.id]));
      setSessions((prev) =>
        prev.map((x) =>
          x.id === s.id ? { ...x, rsvpCount: x.rsvpCount + (sudah ? -1 : 1) } : x
        )
      );
    } catch (err) {
      setError((err as Error).message);
      muatSesi();
    } finally {
      setBusyId("");
    }
  }

  if (error && !week) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
        <div className="panel p-6 text-center">
          <p className="text-3xl">⚠️</p>
          <p className="mt-3 text-sm">{error}</p>
        </div>
      </main>
    );
  }
  if (!week) return <Center>Memuat…</Center>;

  return (
    <main className="wave-top min-h-screen px-5 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <Image src="/logo.png" alt="MSS" width={44} height={44} />
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Daftar ikut latihan
            </p>
            <h1 className="font-bold">{week.label}</h1>
          </div>
        </div>

        {/* Langkah 1: siapa kamu */}
        {!me ? (
          <div className="panel p-5">
            <p className="mb-3 text-sm font-semibold">Siapa nama kamu?</p>
            {!modeBaru ? (
              <>
                <input
                  autoFocus
                  className="field"
                  placeholder="Ketik nama, minimal 2 huruf…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <ul className="mt-2 divide-y divide-[var(--line)]">
                  {kandidat.map((k) => (
                    <li key={k.id}>
                      <button
                        onClick={() => pilihSaya(k)}
                        className="flex w-full items-center gap-2 py-2.5 text-left hover:text-[var(--accent)]"
                      >
                        <span className="font-medium">{k.name}</span>
                        <span
                          className={`badge ml-auto ${
                            k.status === "member" ? "badge-member" : "badge-calon"
                          }`}
                        >
                          {k.status === "member" ? "MEMBER" : "CALON"}
                        </span>
                      </button>
                    </li>
                  ))}
                  {q.trim().length >= 2 && kandidat.length === 0 && (
                    <li className="py-2.5 text-sm text-[var(--muted)]">Nama tidak ditemukan.</li>
                  )}
                </ul>
                <button onClick={() => setModeBaru(true)} className="btn btn-ghost mt-3 w-full">
                  Belum pernah terdaftar? Isi data di sini
                </button>
              </>
            ) : (
              <form
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError("");
                  try {
                    const d = await post({ action: "daftar-baru", ...baru });
                    pilihSaya(d.member);
                  } catch (err) {
                    setError((err as Error).message);
                  }
                }}
              >
                <div>
                  <label className="label">Nama lengkap</label>
                  <input
                    required
                    className="field"
                    value={baru.name}
                    onChange={(e) => setBaru({ ...baru, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Nomor WhatsApp</label>
                  <input
                    required
                    inputMode="tel"
                    className="field"
                    value={baru.phone}
                    onChange={(e) => setBaru({ ...baru, phone: e.target.value })}
                  />
                </div>
                <button className="btn btn-primary w-full">Simpan &amp; lanjut</button>
                <button
                  type="button"
                  onClick={() => setModeBaru(false)}
                  className="btn btn-ghost w-full"
                >
                  Kembali ke pencarian nama
                </button>
              </form>
            )}
            {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
          </div>
        ) : (
          <>
            <div className="panel mb-4 flex items-center gap-2 p-3 text-sm">
              <span className="text-[var(--muted)]">Kamu:</span>
              <span className="font-semibold">{me.name}</span>
              <button
                onClick={() => {
                  setMe(null);
                  setJoined([]);
                  try {
                    localStorage.removeItem("mss-me");
                  } catch {}
                }}
                className="ml-auto text-xs text-[var(--accent)]"
              >
                Bukan saya
              </button>
            </div>

            {error && (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <p className="mb-2 text-sm text-[var(--muted)]">
              Pilih sesi yang mau kamu ikuti minggu ini:
            </p>

            <div className="space-y-3">
              {sessions.map((s) => {
                const ikut = joined.includes(s.id);
                const penuh = s.quota > 0 && s.rsvpCount >= s.quota && !ikut;
                return (
                  <div key={s.id} className="panel p-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0">
                        <p className="font-bold">{tanggalIndo(s.date)}</p>
                        <p className="text-sm text-[var(--muted)]">
                          {s.startTime ? `${s.startTime} · ` : ""}
                          {s.location || s.title}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {s.rsvpCount} orang sudah ikut
                          {s.quota > 0 ? ` · kuota ${s.quota}` : ""}
                        </p>
                      </div>
                      <button
                        disabled={busyId === s.id || (penuh && !ikut) || !s.open}
                        onClick={() => toggle(s)}
                        className={`btn ml-auto shrink-0 px-3 py-1.5 text-xs ${
                          ikut ? "btn-ghost" : "btn-primary"
                        }`}
                      >
                        {busyId === s.id
                          ? "…"
                          : ikut
                            ? "Batal ikut"
                            : penuh
                              ? "Penuh"
                              : "Ikut"}
                      </button>
                    </div>
                    {ikut && (
                      <p className="mt-3 rounded-lg bg-[var(--accent-soft)] p-2 text-center text-xs font-semibold text-[var(--accent)]">
                        ✓ Namamu sudah masuk daftar
                      </p>
                    )}
                  </div>
                );
              })}
              {sessions.length === 0 && (
                <p className="panel p-6 text-center text-sm text-[var(--muted)]">
                  Belum ada sesi di jadwal ini.
                </p>
              )}
            </div>

            <div className="panel mt-5 p-4 text-xs text-[var(--muted)]">
              <p className="mb-1 font-semibold text-[var(--ink)]">Ingat ya:</p>
              <p>
                Presensi di kolam <b>hanya bisa untuk yang sudah ngelist di sini</b>. Saat latihan,
                scan QR yang ditunjukkan relawan pelatih.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
