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
  const sesiTerbuka = sessions.filter((s) => s.open);

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Member" value={jumlahMember} />
        <Stat label="Calon member" value={jumlahCalon} />
        <Stat label="Sesi latihan" value={sessions.length} />
        <Stat label="Sesi dibuka" value={sesiTerbuka.length} accent />
      </div>

      <div className="panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Sesi terbaru</h2>
          <Link href="/admin/sesi" className="text-sm text-[var(--accent)]">
            Kelola sesi →
          </Link>
        </div>
        {sessions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Belum ada sesi latihan. Buat sesi lebih dulu supaya presensi bisa dibuka.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {sessions.slice(0, 5).map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0">
                  <Link href={`/admin/sesi/${s.id}`} className="block truncate font-medium">
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
                <span className={`badge ${s.open ? "badge-member" : "badge-calon"}`}>
                  {s.open ? "DIBUKA" : "DITUTUP"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="panel p-4">
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className={`mt-1 text-2xl font-black ${accent ? "text-[var(--accent)]" : ""}`}>{value}</p>
    </div>
  );
}
