"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdmin } from "@/components/useAdmin";
import type { Member, TrainingSession } from "@/lib/types";

export default function DashboardPage() {
  return (
    <AdminShell>
      <Dashboard />
    </AdminShell>
  );
}

function Dashboard() {
  const { user, api } = useAdmin();
  const [members, setMembers] = useState<Member[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api<{ members: Member[] }>("/api/admin/members"),
      api<{ sessions: TrainingSession[] }>("/api/admin/sessions"),
    ])
      .then(([m, s]) => {
        setMembers(m.members);
        setSessions(s.sessions);
      })
      .catch((e) => setError(e.message));
  }, [user, api]);

  const jumlahMember = members.filter((m) => m.status === "member").length;
  const jumlahCalon = members.filter((m) => m.status === "calon").length;
  const jumlahMenunggu = members.filter((m) => m.verifikasi === "menunggu").length;
  const jumlahGrupBelumDikirim = members.filter(
    (m) => m.status === "member" && !m.grupMemberDikirimAt
  ).length;
  const sesiTerbuka = sessions.filter((s) => s.open);

  return (
    <div className="space-y-5">
      <div>
        <h1>Ringkasan</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Keanggotaan dan sesi latihan MSS Chapter Bangkalan.
        </p>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {jumlahGrupBelumDikirim > 0 && (
        <Perhatian href="/admin/member" aksi="Buka daftar member">
          <b>{jumlahGrupBelumDikirim} member baru</b> sudah ikut latihan pertama tapi belum
          dikonfirmasi dan dikirimi link grup WhatsApp Member.
        </Perhatian>
      )}

      {jumlahMenunggu > 0 && (
        <Perhatian href="/admin/verifikasi" aksi="Periksa sekarang">
          <b>{jumlahMenunggu} calon member</b> menunggu verifikasi. Selama belum disetujui,
          mereka tidak bisa ngelist maupun ikut latihan.
        </Perhatian>
      )}

      <div className="panel grid grid-cols-2 divide-x divide-y divide-[var(--line)] sm:grid-cols-4 sm:divide-y-0">
        <Stat label="Member" value={jumlahMember} />
        <Stat label="Calon member" value={jumlahCalon} />
        <Stat label="Menunggu verifikasi" value={jumlahMenunggu} />
        <Stat label="Sesi dibuka" value={sesiTerbuka.length} />
      </div>

      <div className="panel">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <h2>Sesi terbaru</h2>
          <Link href="/admin/sesi" className="text-sm text-[var(--accent)] hover:underline">
            Kelola sesi
          </Link>
        </div>
        {sessions.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[var(--muted)]">
            Belum ada sesi latihan. Buat sesi lebih dulu supaya presensi bisa dibuka.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {sessions.slice(0, 5).map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <Link
                    href={`/admin/sesi/${s.id}`}
                    className="block truncate font-medium hover:text-[var(--accent)]"
                  >
                    {s.title}
                  </Link>
                  <p className="text-xs text-[var(--muted)]">
                    {s.date}
                    {s.startTime ? ` · ${s.startTime}` : ""}
                    {s.location ? ` · ${s.location}` : ""}
                  </p>
                </div>
                <span className="ml-auto shrink-0 text-sm text-[var(--muted)]">
                  {s.attendeeCount} hadir
                </span>
                <span className="flex w-20 shrink-0 items-center gap-1.5 text-xs">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${s.open ? "bg-green-600" : "bg-gray-400"}`}
                  />
                  {s.open ? "Dibuka" : "Ditutup"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Perhatian({
  href,
  aksi,
  children,
}: {
  href: string;
  aksi: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-[var(--line)] border-l-4 border-l-amber-500 bg-white px-4 py-3 text-sm transition hover:bg-[#fafbfc]"
    >
      <span className="min-w-0 flex-1">{children}</span>
      <span className="shrink-0 font-medium text-[var(--accent)]">{aksi} →</span>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-3.5">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
