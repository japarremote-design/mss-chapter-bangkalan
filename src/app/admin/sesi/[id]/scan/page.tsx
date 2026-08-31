"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdmin } from "@/components/useAdmin";
import type { Member } from "@/lib/types";

export default function ScanPage() {
  return (
    <AdminShell>
      <Scanner />
    </AdminShell>
  );
}

type Hasil = { ok: boolean; text: string; tone: "ok" | "warn" | "err" };

function Scanner() {
  const { id } = useParams<{ id: string }>();
  const { user, api } = useAdmin();
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [manual, setManual] = useState("");
  const [aktif, setAktif] = useState(false);
  const lastRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);

  const kirim = useCallback(
    async (code: string) => {
      // Cegah kartu yang sama terbaca berkali-kali dalam 3 detik.
      const now = Date.now();
      if (lastRef.current.code === code && now - lastRef.current.at < 3000) return;
      lastRef.current = { code, at: now };

      try {
        const d = await api<{ alreadyIn: boolean; promoted: boolean; member: Member }>(
          `/api/admin/sessions/${id}/scan`,
          { method: "POST", body: JSON.stringify({ code }) }
        );
        if (d.alreadyIn) {
          setHasil({ ok: true, tone: "warn", text: `${d.member.name} sudah tercatat hadir.` });
        } else {
          setHasil({
            ok: true,
            tone: "ok",
            text: d.promoted
              ? `${d.member.name} hadir — latihan pertama, status naik jadi ANGGOTA.`
              : `${d.member.name} tercatat hadir.`,
          });
          setLog((prev) => [`${d.member.name} · ${d.member.code}`, ...prev].slice(0, 30));
        }
      } catch (err) {
        setHasil({ ok: false, tone: "err", text: (err as Error).message });
      }
    },
    [api, id]
  );

  useEffect(() => {
    if (!aktif || !user) return;
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
            ok: false,
            tone: "err",
            text: "Tidak bisa mengakses kamera. Pastikan izin kamera diberikan dan situs diakses via HTTPS.",
          });
          setAktif(false);
        }
      }
    })();

    return () => {
      stopped = true;
      scannerRef.current?.stop().then(() => scannerRef.current?.clear()).catch(() => {});
      scannerRef.current = null;
    };
  }, [aktif, user, kirim]);

  const toneClass =
    hasil?.tone === "ok"
      ? "border-green-300 bg-green-50 text-green-800"
      : hasil?.tone === "warn"
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-red-300 bg-red-50 text-red-700";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold">Scan kartu anggota</h1>
        <Link href={`/admin/sesi/${id}`} className="btn btn-ghost ml-auto px-3 py-1 text-xs">
          ← Kembali ke sesi
        </Link>
      </div>

      <div className="panel p-4">
        {!aktif ? (
          <button onClick={() => setAktif(true)} className="btn btn-primary">
            Nyalakan kamera
          </button>
        ) : (
          <button onClick={() => setAktif(false)} className="btn btn-ghost">
            Matikan kamera
          </button>
        )}
        <div id="reader" className="mt-4 overflow-hidden rounded-xl" />
      </div>

      {hasil && <div className={`rounded-xl border p-3 text-sm ${toneClass}`}>{hasil.text}</div>}

      <form
        className="panel flex gap-2 p-4"
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
          placeholder="Input manual kode kartu, mis. MSS-7F3K2Q"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
        />
        <button className="btn btn-primary shrink-0">Catat</button>
      </form>

      {log.length > 0 && (
        <div className="panel p-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-[var(--muted)]">
            Baru saja tercatat
          </p>
          <ul className="space-y-1 text-sm">
            {log.map((l, i) => (
              <li key={i} className="text-[var(--muted)]">
                {l}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
