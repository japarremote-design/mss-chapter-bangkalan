"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Qr } from "@/components/Qr";
import { useAdmin } from "@/components/useAdmin";
import type { AttendanceRecord, TrainingSession } from "@/lib/types";

export default function SesiDetailPage() {
  return (
    <AdminShell>
      <Detail />
    </AdminShell>
  );
}

type Payload = {
  session: TrainingSession;
  attendance: AttendanceRecord[];
  token: string;
  tokenWindowMs: number;
};

function Detail() {
  const { id } = useParams<{ id: string }>();
  const { user, api } = useAdmin();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  const load = useCallback(() => {
    if (!user) return;
    api<Payload>(`/api/admin/sessions/${id}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [user, api, id]);

  // Refresh token QR + daftar hadir tiap 10 detik.
  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  function unduhCsv() {
    if (!data) return;
    const rows = [
      ["Nama", "Kode", "Metode", "Waktu"],
      ...data.attendance.map((a) => [
        a.name,
        a.code,
        a.method,
        new Date(a.at).toLocaleString("id-ID"),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `presensi-${data.session.date}-${data.session.title}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) return <p className="text-sm text-[var(--accent)]">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--muted)]">Memuat…</p>;

  const { session, attendance, token } = data;
  const checkinUrl = `${origin}/a/${session.id}?t=${token}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-lg font-bold">{session.title}</h1>
          <p className="text-xs text-[var(--muted)]">
            {session.date}
            {session.startTime ? ` · ${session.startTime}` : ""}
            {session.location ? ` · ${session.location}` : ""}
          </p>
        </div>
        <span className={`badge ${session.open ? "badge-member" : "badge-calon"}`}>
          {session.open ? "PRESENSI DIBUKA" : "PRESENSI DITUTUP"}
        </span>
        <div className="ml-auto flex gap-2">
          <Link href={`/admin/sesi/${session.id}/scan`} className="btn btn-ghost">
            Mode scan kartu
          </Link>
          <button onClick={unduhCsv} className="btn btn-ghost">
            Unduh CSV
          </button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[auto_1fr]">
        <div className="panel flex flex-col items-center p-6">
          <p className="mb-3 text-center text-sm font-semibold">Scan untuk presensi</p>
          {session.open ? (
            <>
              <Qr value={checkinUrl} size={280} />
              <p className="mt-3 max-w-64 text-center text-xs text-[var(--muted)]">
                QR berganti otomatis tiap 20 detik, jadi screenshot lama tidak bisa dipakai titip
                absen.
              </p>
            </>
          ) : (
            <p className="py-12 text-center text-sm text-[var(--muted)]">
              Presensi ditutup. Buka lagi dari halaman Sesi Latihan.
            </p>
          )}
        </div>

        <div className="panel p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Daftar hadir</h2>
            <span className="text-sm text-[var(--muted)]">{attendance.length} orang</span>
          </div>
          <ul className="max-h-96 divide-y divide-[var(--line)] overflow-y-auto">
            {attendance.map((a) => (
              <li key={a.memberId} className="flex items-center gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{a.name}</p>
                  <p className="font-mono text-xs text-[var(--muted)]">{a.code}</p>
                </div>
                <div className="ml-auto text-right text-xs text-[var(--muted)]">
                  <p>{new Date(a.at).toLocaleTimeString("id-ID")}</p>
                  <p>{a.method === "mandiri" ? "scan QR sesi" : "scan kartu"}</p>
                </div>
              </li>
            ))}
            {attendance.length === 0 && (
              <li className="py-6 text-center text-sm text-[var(--muted)]">Belum ada yang hadir.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
