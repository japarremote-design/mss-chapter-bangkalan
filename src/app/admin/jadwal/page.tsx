"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdmin } from "@/components/useAdmin";
import type { Schedule } from "@/lib/types";

export default function JadwalPage() {
  return (
    <AdminShell>
      <Jadwal />
    </AdminShell>
  );
}

function Jadwal() {
  const { user, api } = useAdmin();
  const [items, setItems] = useState<Schedule[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    day: "Sabtu",
    time: "07.00 - 09.00",
    pool: "",
    status: "Tersedia" as Schedule["status"],
  });

  useEffect(() => {
    if (!user) return;
    api<{ schedules: Schedule[] }>("/api/admin/jadwal")
      .then((d) => setItems(d.schedules))
      .catch((e) => setError(e.message));
  }, [user, api]);

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d = await api<{ schedule: Schedule }>("/api/admin/jadwal", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setItems((prev) => [...prev, d.schedule]);
      setForm({ ...form, pool: "" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function ubah(s: Schedule, patch: Partial<Schedule>) {
    try {
      const d = await api<{ schedule: Schedule }>(`/api/admin/jadwal/${s.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setItems((prev) => prev.map((x) => (x.id === s.id ? d.schedule : x)));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function hapus(s: Schedule) {
    if (!confirm(`Hapus jadwal ${s.day} ${s.time}?`)) return;
    try {
      await api(`/api/admin/jadwal/${s.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((x) => x.id !== s.id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold">Jadwal Latihan</h1>
        <p className="text-xs text-[var(--muted)]">
          Tampil di beranda dan tersedia untuk situs Blogger lewat{" "}
          <code className="rounded bg-[var(--accent-soft)] px-1">/api/public/jadwal</code>.
        </p>
      </div>

      <form onSubmit={tambah} className="panel grid gap-3 p-4 sm:grid-cols-5">
        <div>
          <label className="label">Hari</label>
          <input
            required
            className="field"
            value={form.day}
            onChange={(e) => setForm({ ...form, day: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Jam</label>
          <input
            required
            className="field"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Lokasi kolam</label>
          <input
            className="field"
            placeholder="mis. Kolam Syariah Bangkalan"
            value={form.pool}
            onChange={(e) => setForm({ ...form, pool: e.target.value })}
          />
        </div>
        <div className="flex items-end">
          <button disabled={busy} className="btn btn-primary w-full">
            {busy ? "Menyimpan…" : "Tambah"}
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="panel divide-y divide-[var(--line)]">
        {items.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0">
              <p className="font-semibold">
                {s.day} · {s.time}
              </p>
              <p className="text-xs text-[var(--muted)]">{s.pool || "Lokasi belum diisi"}</p>
            </div>
            <button
              onClick={() => ubah(s, { status: s.status === "Penuh" ? "Tersedia" : "Penuh" })}
              className="ml-auto"
              title="Klik untuk mengubah status"
            >
              <span className={`badge ${s.status === "Penuh" ? "badge-calon" : "badge-member"}`}>
                {s.status.toUpperCase()}
              </span>
            </button>
            <button
              onClick={() => hapus(s)}
              className="text-xs text-[var(--muted)] hover:text-[var(--danger)]"
            >
              Hapus
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="p-6 text-center text-sm text-[var(--muted)]">
            Belum ada jadwal. Tambahkan lewat form di atas.
          </p>
        )}
      </div>
    </div>
  );
}
