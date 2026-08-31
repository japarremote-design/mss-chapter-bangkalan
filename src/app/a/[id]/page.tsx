"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

type SessionInfo = {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  location?: string;
};
type Kandidat = { id: string; name: string; status: "calon" | "member" };

export default function CheckinPage() {
  return (
    <Suspense fallback={<Center>Memuat…</Center>}>
      <Checkin />
    </Suspense>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5 text-sm text-[var(--muted)]">
      {children}
    </main>
  );
}

function Checkin() {
  const { id } = useParams<{ id: string }>();
  const token = useSearchParams().get("t") ?? "";

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [kandidat, setKandidat] = useState<Kandidat[]>([]);
  const [busy, setBusy] = useState(false);
  const [sukses, setSukses] = useState<{ name: string; promoted: boolean; already: boolean } | null>(
    null
  );
  const [modeBaru, setModeBaru] = useState(false);
  const [baru, setBaru] = useState({ name: "", phone: "" });

  useEffect(() => {
    fetch(`/api/public/session/${id}?t=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setSession(d.session);
      })
      .catch((e) => setError(e.message));
  }, [id, token]);

  // Cari nama sambil mengetik.
  useEffect(() => {
    if (q.trim().length < 2) {
      setKandidat([]);
      return;
    }
    const t = setTimeout(() => {
      fetch("/api/public/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id, token, q }),
      })
        .then((r) => r.json())
        .then((d) => setKandidat(d.members ?? []))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q, id, token]);

  const hadir = useCallback(
    async (payload: Record<string, string>) => {
      setBusy(true);
      setError("");
      try {
        const r = await fetch("/api/public/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: id, token, ...payload }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setSukses({ name: d.name, promoted: d.promoted, already: d.alreadyIn });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [id, token]
  );

  if (sukses) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
        <div className="panel p-8 text-center">
          <p className="text-4xl">{sukses.already ? "✔" : "✅"}</p>
          <h1 className="mt-3 text-xl font-bold">
            {sukses.already ? "Kamu sudah tercatat" : "Presensi berhasil"}
          </h1>
          <p className="mt-1 text-lg font-semibold text-[var(--accent)]">{sukses.name}</p>
          {sukses.promoted && (
            <p className="mt-3 text-sm text-green-700">
              Selamat! Ini latihan pertamamu — statusmu naik jadi <b>ANGGOTA</b>.
            </p>
          )}
          <p className="mt-4 text-xs text-[var(--muted)]">Tunjukkan layar ini ke pengurus.</p>
        </div>
      </main>
    );
  }

  if (error && !session) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
        <div className="panel p-6 text-center">
          <p className="text-3xl">⚠️</p>
          <p className="mt-3 text-sm">{error}</p>
        </div>
      </main>
    );
  }

  if (!session) return <Center>Memuat…</Center>;

  return (
    <main className="mx-auto max-w-md px-5 py-8">
      <div className="panel mb-4 flex items-center gap-3 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="MSS" width={44} height={44} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Presensi latihan</p>
          <h1 className="truncate text-lg font-bold">{session.title}</h1>
          <p className="text-xs text-[var(--muted)]">
            {session.date}
            {session.startTime ? ` · ${session.startTime}` : ""}
            {session.location ? ` · ${session.location}` : ""}
          </p>
        </div>
      </div>

      {!modeBaru ? (
        <>
          <label className="label">Cari namamu</label>
          <input
            autoFocus
            className="field"
            placeholder="Ketik minimal 2 huruf…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <ul className="panel mt-3 divide-y divide-[var(--line)]">
            {kandidat.map((k) => (
              <li key={k.id}>
                <button
                  disabled={busy}
                  onClick={() => hadir({ memberId: k.id })}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-[var(--accent-soft)]"
                >
                  <span className="font-medium">{k.name}</span>
                  <span
                    className={`badge ml-auto ${
                      k.status === "member" ? "badge-member" : "badge-calon"
                    }`}
                  >
                    {k.status === "member" ? "ANGGOTA" : "CALON"}
                  </span>
                </button>
              </li>
            ))}
            {q.trim().length >= 2 && kandidat.length === 0 && (
              <li className="px-4 py-3 text-sm text-[var(--muted)]">Nama tidak ditemukan.</li>
            )}
            {q.trim().length < 2 && (
              <li className="px-4 py-3 text-sm text-[var(--muted)]">
                Hasil pencarian muncul di sini.
              </li>
            )}
          </ul>

          {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}

          <button onClick={() => setModeBaru(true)} className="btn btn-ghost mt-4 w-full">
            Belum terdaftar? Daftar sekarang
          </button>
        </>
      ) : (
        <form
          className="panel space-y-3 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            hadir({ name: baru.name, phone: baru.phone });
          }}
        >
          <p className="text-sm text-[var(--muted)]">
            Isi data singkat, kamu langsung tercatat hadir di latihan ini.
          </p>
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
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button disabled={busy} className="btn btn-primary w-full">
            {busy ? "Memproses…" : "Daftar & hadir"}
          </button>
          <button type="button" onClick={() => setModeBaru(false)} className="btn btn-ghost w-full">
            Kembali ke pencarian nama
          </button>
        </form>
      )}
    </main>
  );
}
