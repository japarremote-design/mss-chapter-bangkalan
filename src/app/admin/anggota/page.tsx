"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdmin } from "@/components/useAdmin";
import type { Member, MemberStatus } from "@/lib/types";

export default function AnggotaPage() {
  return (
    <AdminShell>
      <Anggota />
    </AdminShell>
  );
}

function Anggota() {
  const { user, api } = useAdmin();
  const [members, setMembers] = useState<Member[]>([]);
  const [filter, setFilter] = useState<"semua" | MemberStatus>("semua");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    api<{ members: Member[] }>("/api/admin/members")
      .then((d) => setMembers(d.members))
      .catch((e) => setError(e.message));
  }, [user, api]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return members.filter(
      (m) =>
        (filter === "semua" || m.status === filter) &&
        (!needle ||
          m.name.toLowerCase().includes(needle) ||
          m.code.toLowerCase().includes(needle) ||
          (m.phone ?? "").includes(needle))
    );
  }, [members, filter, q]);

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const d = await api<{ member: Member }>("/api/admin/members", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setMembers((prev) => [...prev, d.member].sort((a, b) => a.name.localeCompare(b.name)));
      setForm({ name: "", phone: "", address: "", note: "" });
      setShowForm(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function hapus(m: Member) {
    if (!confirm(`Hapus ${m.name}? Riwayat presensi yang sudah tercatat tidak ikut terhapus.`)) return;
    try {
      await api(`/api/admin/members/${m.id}`, { method: "DELETE" });
      setMembers((prev) => prev.filter((x) => x.id !== m.id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-bold">Anggota</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn btn-primary ml-auto">
          {showForm ? "Batal" : "+ Tambah"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={tambah} className="panel grid gap-3 p-4 sm:grid-cols-2">
          <div>
            <label className="label">Nama lengkap</label>
            <input
              required
              className="field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Nomor WhatsApp</label>
            <input
              className="field"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Alamat</label>
            <input
              className="field"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Catatan</label>
            <input
              className="field"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <button disabled={busy} className="btn btn-primary">
              {busy ? "Menyimpan…" : "Simpan sebagai calon anggota"}
            </button>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Status naik otomatis jadi <b>anggota</b> begitu yang bersangkutan tercatat hadir di
              latihan pertamanya.
            </p>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {(["semua", "member", "calon"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn px-3 py-1 text-xs ${filter === f ? "btn-primary" : "btn-ghost"}`}
          >
            {f === "semua" ? "Semua" : f === "member" ? "Anggota" : "Calon anggota"}
          </button>
        ))}
        <input
          placeholder="Cari nama / kode / HP…"
          className="field ml-auto max-w-56"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-left text-xs uppercase text-[var(--muted)]">
              <th className="px-4 py-2.5">Nama</th>
              <th className="px-4 py-2.5">Kode</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Hadir</th>
              <th className="px-4 py-2.5">Terakhir</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((m) => (
              <tr key={m.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-2.5">
                  <div className="font-medium">{m.name}</div>
                  {m.phone && <div className="text-xs text-[var(--muted)]">{m.phone}</div>}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">{m.code}</td>
                <td className="px-4 py-2.5">
                  <span className={`badge ${m.status === "member" ? "badge-member" : "badge-calon"}`}>
                    {m.status === "member" ? "ANGGOTA" : "CALON"}
                  </span>
                </td>
                <td className="px-4 py-2.5">{m.attendanceCount}×</td>
                <td className="px-4 py-2.5 text-xs text-[var(--muted)]">
                  {m.lastAttendedAt ? new Date(m.lastAttendedAt).toLocaleDateString("id-ID") : "—"}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <Link href={`/kartu/${m.code}`} className="text-xs text-[var(--accent)]">
                    Kartu QR
                  </Link>
                  <button
                    onClick={() => hapus(m)}
                    className="ml-3 text-xs text-[var(--muted)] hover:text-[var(--danger)]"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-[var(--muted)]">
                  Belum ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
