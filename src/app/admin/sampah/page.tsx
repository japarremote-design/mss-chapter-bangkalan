"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdmin } from "@/components/useAdmin";
import type { Member, Schedule } from "@/lib/types";

export default function SampahPage() {
  return (
    <AdminShell>
      <Sampah />
    </AdminShell>
  );
}

function Sampah() {
  const { user, api } = useAdmin();
  const [members, setMembers] = useState<Member[]>([]);
  const [jadwal, setJadwal] = useState<Schedule[]>([]);
  const [error, setError] = useState("");

  const muat = useCallback(() => {
    api<{ members: Member[] }>("/api/admin/members?dihapus=1")
      .then((d) => setMembers(d.members))
      .catch((e) => setError(e.message));
    api<{ schedules: Schedule[] }>("/api/admin/jadwal?dihapus=1")
      .then((d) => setJadwal(d.schedules))
      .catch((e) => setError(e.message));
  }, [api]);

  useEffect(() => {
    if (user) muat();
  }, [user, muat]);

  async function aksi(url: string, opts: RequestInit, setelah: () => void) {
    try {
      await api(url, opts);
      setelah();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const pulihkanMember = (m: Member) =>
    aksi(`/api/admin/members/${m.id}`, { method: "PATCH", body: JSON.stringify({ pulihkan: true }) }, () =>
      setMembers((p) => p.filter((x) => x.id !== m.id))
    );
  const permanenMember = (m: Member) => {
    if (!confirm(`HAPUS PERMANEN ${m.name}? Data tidak bisa dikembalikan lagi.`)) return;
    aksi(`/api/admin/members/${m.id}?permanen=1`, { method: "DELETE" }, () =>
      setMembers((p) => p.filter((x) => x.id !== m.id))
    );
  };
  const pulihkanJadwal = (s: Schedule) =>
    aksi(`/api/admin/jadwal/${s.id}`, { method: "PATCH", body: JSON.stringify({ pulihkan: true }) }, () =>
      setJadwal((p) => p.filter((x) => x.id !== s.id))
    );
  const permanenJadwal = (s: Schedule) => {
    if (!confirm(`HAPUS PERMANEN jadwal ${s.day} ${s.time}? Tidak bisa dikembalikan.`)) return;
    aksi(`/api/admin/jadwal/${s.id}?permanen=1`, { method: "DELETE" }, () =>
      setJadwal((p) => p.filter((x) => x.id !== s.id))
    );
  };

  const tgl = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("id-ID") : "—");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold">Sampah</h1>
        <p className="text-xs text-[var(--muted)]">
          Yang dihapus dari Member dan Jadwal masuk ke sini dulu. Bisa dipulihkan, atau dihapus
          permanen (tidak bisa dikembalikan).
        </p>
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <section className="panel divide-y divide-[var(--line)]">
        <h2 className="p-4 text-sm font-semibold">Member ({members.length})</h2>
        {members.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <div className="min-w-0">
              <p className="font-semibold">{m.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {m.code} · {m.phone || "tanpa HP"} · dihapus {tgl(m.deletedAt)}
                {m.deletedBy ? ` oleh ${m.deletedBy}` : ""}
              </p>
            </div>
            <div className="ml-auto flex gap-3 text-xs">
              <button onClick={() => pulihkanMember(m)} className="text-[var(--accent)]">
                Pulihkan
              </button>
              <button onClick={() => permanenMember(m)} className="text-[var(--danger)]">
                Hapus permanen
              </button>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <p className="p-4 text-center text-sm text-[var(--muted)]">Tidak ada member di sampah.</p>
        )}
      </section>

      <section className="panel divide-y divide-[var(--line)]">
        <h2 className="p-4 text-sm font-semibold">Jadwal ({jadwal.length})</h2>
        {jadwal.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <div className="min-w-0">
              <p className="font-semibold">
                {s.day} · {s.time}
              </p>
              <p className="text-xs text-[var(--muted)]">{s.pool || "Lokasi belum diisi"}</p>
            </div>
            <div className="ml-auto flex gap-3 text-xs">
              <button onClick={() => pulihkanJadwal(s)} className="text-[var(--accent)]">
                Pulihkan
              </button>
              <button onClick={() => permanenJadwal(s)} className="text-[var(--danger)]">
                Hapus permanen
              </button>
            </div>
          </div>
        ))}
        {jadwal.length === 0 && (
          <p className="p-4 text-center text-sm text-[var(--muted)]">Tidak ada jadwal di sampah.</p>
        )}
      </section>
    </div>
  );
}
