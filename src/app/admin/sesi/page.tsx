"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdmin } from "@/components/useAdmin";
import type { TrainingSession } from "@/lib/types";

export default function SesiPage() {
  return (
    <AdminShell>
      <Sesi />
    </AdminShell>
  );
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function Sesi() {
  const { user, api } = useAdmin();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "Latihan Rutin",
    date: todayISO(),
    startTime: "16:00",
    location: "",
  });

  useEffect(() => {
    if (!user) return;
    api<{ sessions: TrainingSession[] }>("/api/admin/sessions")
      .then((d) => setSessions(d.sessions))
      .catch((e) => setError(e.message));
  }, [user, api]);

  async function buat(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d = await api<{ session: TrainingSession }>("/api/admin/sessions", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSessions((prev) => [d.session, ...prev]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(s: TrainingSession) {
    try {
      const d = await api<{ session: TrainingSession }>(`/api/admin/sessions/${s.id}`, {
        method: "PATCH",
        body: JSON.stringify({ open: !s.open }),
      });
      setSessions((prev) => prev.map((x) => (x.id === s.id ? d.session : x)));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold">Sesi Latihan</h1>

      <form onSubmit={buat} className="panel grid gap-3 p-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="label">Judul</label>
          <input
            required
            className="field"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Tanggal</label>
          <input
            type="date"
            required
            className="field"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Jam</label>
          <input
            type="time"
            className="field"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          />
        </div>
        <div className="sm:col-span-3">
          <label className="label">Lokasi</label>
          <input
            className="field"
            placeholder="mis. Lapangan Rato Ebu"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
        <div className="flex items-end">
          <button disabled={busy} className="btn btn-primary w-full">
            {busy ? "Membuat…" : "Buat sesi"}
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-[var(--accent)]">{error}</p>}

      <div className="panel divide-y divide-[var(--line)]">
        {sessions.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0">
              <Link href={`/admin/sesi/${s.id}`} className="font-semibold">
                {s.title}
              </Link>
              <p className="text-xs text-[var(--muted)]">
                {s.date}
                {s.startTime ? ` · ${s.startTime}` : ""}
                {s.location ? ` · ${s.location}` : ""}
              </p>
            </div>
            <span className="ml-auto text-sm text-[var(--muted)]">{s.attendeeCount} hadir</span>
            <button onClick={() => toggle(s)} className="btn btn-ghost px-3 py-1 text-xs">
              {s.open ? "Tutup presensi" : "Buka presensi"}
            </button>
            <Link href={`/admin/sesi/${s.id}`} className="btn btn-primary px-3 py-1 text-xs">
              Buka layar QR
            </Link>
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="p-6 text-center text-sm text-[var(--muted)]">Belum ada sesi latihan.</p>
        )}
      </div>
    </div>
  );
}
