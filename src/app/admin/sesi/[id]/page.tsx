"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Qr } from "@/components/Qr";
import { useAdmin } from "@/components/useAdmin";
import type { AttendanceRecord, RsvpEntry, TrainingSession } from "@/lib/types";

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
  rsvp: RsvpEntry[];
  token: string;
  relawanToken: string;
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
      ["Nama", "Kode", "Status", "Ngelist", "Hadir", "Metode", "Waktu hadir"],
      ...data.rsvp.map((r) => {
        const hadir = data.attendance.find((a) => a.memberId === r.memberId);
        return [
          r.name,
          r.code,
          r.status === "calon" ? "calon member" : "member",
          "ya",
          hadir ? "ya" : "tidak",
          hadir?.method ?? "-",
          hadir ? new Date(hadir.at).toLocaleString("id-ID") : "-",
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `presensi-${data.session.date}-${data.session.title}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) return <p className="text-sm text-[var(--danger)]">{error}</p>;
  if (!data) return <p className="text-sm text-[var(--muted)]">Memuat…</p>;

  const { session, attendance, rsvp, token, relawanToken } = data;
  const linkRelawan = `${origin}/relawan/${session.id}?k=${relawanToken}`;
  const hadirIds = new Set(attendance.map((a) => a.memberId));
  const belumHadir = rsvp.filter((r) => !hadirIds.has(r.memberId));
  const statusById = new Map(rsvp.map((r) => [r.memberId, r.status]));
  const jumlahCalon = rsvp.filter((r) => r.status === "calon").length;
  const jumlahMember = rsvp.length - jumlahCalon;
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
            {session.coaches.length > 0 ? ` · Relawan pelatih: ${session.coaches.join(" & ")}` : ""}
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

      <div className="panel p-4">
        <p className="mb-1 text-sm font-bold">Link untuk relawan pelatih</p>
        <p className="mb-2 text-xs text-[var(--muted)]">
          Kirim ke relawan pelatih yang bertugas. Dari link ini mereka bisa menampilkan QR dan scan kartu
          tanpa perlu akun — dan tidak bisa melihat data member lain.
        </p>
        <p className="mb-2 break-all rounded-lg bg-[var(--accent-soft)] p-2 font-mono text-xs">
          {linkRelawan}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigator.clipboard?.writeText(linkRelawan)}
            className="btn btn-ghost px-3 py-1 text-xs"
          >
            Salin link relawan pelatih
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Link relawan pelatih untuk latihan ${session.date}${
                session.startTime ? ` ${session.startTime}` : ""
              }${session.location ? ` di ${session.location}` : ""}:\n${linkRelawan}\n\nBuka di HP saat latihan untuk menampilkan QR presensi.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary px-3 py-1 text-xs"
          >
            Kirim lewat WhatsApp
          </a>
          <a href={linkRelawan} target="_blank" rel="noopener noreferrer" className="btn btn-ghost px-3 py-1 text-xs">
            Buka layar relawan pelatih
          </a>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[auto_1fr]">
        <div className="panel flex flex-col items-center p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="MSS" width={56} height={56} className="mb-2" />
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
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="font-bold">Kehadiran</h2>
            <span className="ml-auto text-sm text-[var(--muted)]">
              <b className="text-[var(--ink)]">{attendance.length}</b> hadir dari{" "}
              <b className="text-[var(--ink)]">{rsvp.length}</b> yang ngelist
            </span>
          </div>

          {rsvp.length > 0 && (
            <p className="mb-3 flex gap-2 text-xs">
              <span className="badge badge-calon">{jumlahCalon} CALON</span>
              <span className="badge badge-member">{jumlahMember} MEMBER</span>
            </p>
          )}
          <ul className="max-h-96 divide-y divide-[var(--line)] overflow-y-auto">
            {attendance.map((a) => (
              <li key={a.memberId} className="flex items-center gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {a.name}{" "}
                    <span
                      className={`badge ${
                        statusById.get(a.memberId) === "calon" ? "badge-calon" : "badge-member"
                      }`}
                    >
                      {statusById.get(a.memberId) === "calon" ? "CALON" : "MEMBER"}
                    </span>
                  </p>
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

          {belumHadir.length > 0 && (
            <div className="mt-4 border-t border-[var(--line)] pt-3">
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
                    <span className="text-[var(--muted)]">
                      {r.status === "calon" ? " · calon" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {rsvp.length === 0 && (
            <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
              Belum ada yang ngelist untuk sesi ini. Presensi hanya bisa untuk yang sudah ngelist —
              share dulu link jadwal mingguan ke grup WhatsApp.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
