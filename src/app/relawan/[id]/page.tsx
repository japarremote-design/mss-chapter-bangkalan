"use client";

import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Qr } from "@/components/Qr";
import type { AttendanceRecord, RsvpEntry, TrainingSession } from "@/lib/types";

type Payload = {
  session: TrainingSession;
  attendance: AttendanceRecord[];
  rsvp: RsvpEntry[];
  token: string;
};
type Hasil = { tone: "ok" | "warn" | "err"; text: string; forceCode?: string };

export default function RelawanPage() {
  return (
    <Suspense fallback={<Center>Memuat…</Center>}>
      <Relawan />
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

function Relawan() {
  const { id } = useParams<{ id: string }>();
  const k = useSearchParams().get("k") ?? "";

  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");
  const [tab, setTab] = useState<"qr" | "scan">("qr");
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [manual, setManual] = useState("");
  const [kameraAktif, setKameraAktif] = useState(false);
  const lastRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  const load = useCallback(() => {
    fetch(`/api/public/relawan/${id}?k=${encodeURIComponent(k)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, [id, k]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  const kirim = useCallback(
    async (code: string, force = false) => {
      const now = Date.now();
      if (!force && lastRef.current.code === code && now - lastRef.current.at < 3000) return;
      lastRef.current = { code, at: now };
      try {
        const r = await fetch(`/api/public/relawan/${id}/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, force, k }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (d.alreadyIn) {
          setHasil({ tone: "warn", text: `${d.member.name} sudah tercatat hadir.` });
        } else {
          setHasil({
            tone: "ok",
            text: d.promoted
              ? `${d.member.name} hadir — latihan pertama, statusnya naik jadi MEMBER.`
              : `${d.member.name} tercatat hadir.`,
          });
          load();
        }
      } catch (err) {
        const text = (err as Error).message;
        setHasil({
          tone: "err",
          text,
          forceCode: text.includes("belum ngelist") ? code : undefined,
        });
      }
    },
    [id, k, load]
  );

  useEffect(() => {
    if (!kameraAktif) return;
    let stopped = false;
    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner as unknown as { stop: () => Promise<void>; clear: () => void };
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (text) => kirim(text),
          () => {}
        );
      } catch {
        if (!stopped) {
          setHasil({
            tone: "err",
            text: "Tidak bisa mengakses kamera. Pastikan izinnya diberikan.",
          });
          setKameraAktif(false);
        }
      }
    })();
    return () => {
      stopped = true;
      scannerRef.current?.stop().then(() => scannerRef.current?.clear()).catch(() => {});
      scannerRef.current = null;
    };
  }, [kameraAktif, kirim]);

  if (error && !data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
        <div className="panel p-6 text-center">
          <p className="text-3xl">⚠️</p>
          <p className="mt-3 text-sm">{error}</p>
        </div>
      </main>
    );
  }
  if (!data) return <Center>Memuat…</Center>;

  const { session, attendance, rsvp, token } = data;
  const hadirIds = new Set(attendance.map((a) => a.memberId));
  const belumHadir = rsvp.filter((r) => !hadirIds.has(r.memberId));
  const checkinUrl = `${origin}/a/${session.id}?t=${token}`;

  const toneClass =
    hasil?.tone === "ok"
      ? "border-green-300 bg-green-50 text-green-800"
      : hasil?.tone === "warn"
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-red-300 bg-red-50 text-red-700";

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="MSS" width={40} height={40} />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Layar relawan pelatih</p>
            <h1 className="truncate font-bold">{session.title}</h1>
            <p className="text-xs text-[var(--muted)]">
              {session.date}
              {session.startTime ? ` · ${session.startTime}` : ""}
              {session.location ? ` · ${session.location}` : ""}
            </p>
          </div>
        </div>

        {session.coaches.length > 0 && (
          <p className="text-xs text-[var(--muted)]">
            Relawan pelatih: <b className="text-[var(--ink)]">{session.coaches.join(" & ")}</b>
          </p>
        )}

        <div className="panel flex items-center gap-3 p-3 text-sm">
          <span>
            <b>{attendance.length}</b> hadir
          </span>
          <span className="text-[var(--muted)]">dari {rsvp.length} yang ngelist</span>
          <span
            className={`badge ml-auto ${session.open ? "badge-member" : "badge-calon"}`}
          >
            {session.open ? "DIBUKA" : "DITUTUP"}
          </span>
        </div>

        <div className="flex gap-2">
          {(["qr", "scan"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`btn flex-1 ${tab === t ? "btn-primary" : "btn-ghost"}`}
            >
              {t === "qr" ? "Tampilkan QR" : "Scan kartu"}
            </button>
          ))}
        </div>

        {tab === "qr" ? (
          <div className="panel flex flex-col items-center p-5">
            {session.open ? (
              <>
                <Qr value={checkinUrl} size={260} />
                <p className="mt-3 text-center text-xs text-[var(--muted)]">
                  Tunjukkan layar ini ke peserta. QR berganti tiap 20 detik supaya tidak bisa
                  dipakai titip absen.
                </p>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-[var(--muted)]">
                Presensi sesi ini sudah ditutup admin.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="panel p-4">
              <button
                onClick={() => setKameraAktif((v) => !v)}
                className={`btn w-full ${kameraAktif ? "btn-ghost" : "btn-primary"}`}
              >
                {kameraAktif ? "Matikan kamera" : "Nyalakan kamera"}
              </button>
              <div id="reader" className="mt-3 overflow-hidden rounded-xl" />
            </div>

            <form
              className="panel flex gap-2 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                const code = manual.trim().toUpperCase();
                if (code) {
                  lastRef.current = { code: "", at: 0 };
                  kirim(code);
                  setManual("");
                }
              }}
            >
              <input
                className="field"
                placeholder="Kode kartu, mis. MSS-7F3K2Q"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
              />
              <button className="btn btn-primary shrink-0">Catat</button>
            </form>
          </div>
        )}

        {hasil && (
          <div className={`rounded-xl border p-3 text-sm ${toneClass}`}>
            <p>{hasil.text}</p>
            {hasil.forceCode && (
              <button
                onClick={() => kirim(hasil.forceCode as string, true)}
                className="btn btn-ghost mt-2 px-3 py-1 text-xs"
              >
                Tetap catat hadir (tanpa list)
              </button>
            )}
          </div>
        )}

        <div className="panel p-4">
          <p className="mb-2 text-sm font-bold">Sudah hadir ({attendance.length})</p>
          <ul className="max-h-64 divide-y divide-[var(--line)] overflow-y-auto text-sm">
            {attendance.map((a) => (
              <li key={a.memberId} className="flex items-center gap-2 py-2">
                <span className="truncate">{a.name}</span>
                <span className="ml-auto text-xs text-[var(--muted)]">
                  {new Date(a.at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
            {attendance.length === 0 && (
              <li className="py-4 text-center text-[var(--muted)]">Belum ada yang hadir.</li>
            )}
          </ul>

          {belumHadir.length > 0 && (
            <div className="mt-3 border-t border-[var(--line)] pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Ngelist tapi belum hadir ({belumHadir.length})
              </p>
              <ul className="flex flex-wrap gap-2">
                {belumHadir.map((r) => (
                  <li
                    key={r.memberId}
                    className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs"
                  >
                    {r.name}
                    {r.status === "calon" && (
                      <span className="text-[var(--muted)]"> · calon</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <p className="pb-6 text-center text-xs text-[var(--muted)]">
          Link ini khusus sesi ini. Jangan dibagikan ke peserta.
        </p>
      </div>
    </main>
  );
}
