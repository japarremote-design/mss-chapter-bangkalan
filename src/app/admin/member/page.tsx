"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdmin } from "@/components/useAdmin";
import { ImporMember } from "@/components/ImporMember";
import type { Member, MemberStatus } from "@/lib/types";

export default function MemberPage() {
  return (
    <AdminShell>
      <Member />
    </AdminShell>
  );
}

function Member() {
  const { user, api } = useAdmin();
  const [members, setMembers] = useState<Member[]>([]);
  const [filter, setFilter] = useState<"semua" | MemberStatus>("semua");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [buka, setBuka] = useState("");
  const [showImpor, setShowImpor] = useState(false);

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

  function unduhCsv() {
    const kolom: [string, (m: Member) => string][] = [
      ["Nama lengkap", (m) => m.name],
      ["Nama panggilan", (m) => m.nickname ?? ""],
      ["Kode", (m) => m.code],
      ["Status", (m) => (m.status === "calon" ? "calon member" : "member")],
      ["Usia", (m) => m.age ?? ""],
      ["Jenis kelamin", (m) => m.gender ?? ""],
      ["Agama", (m) => m.religion ?? ""],
      ["Alamat domisili", (m) => m.address ?? ""],
      ["Pekerjaan", (m) => m.job ?? ""],
      ["Status pernikahan", (m) => m.maritalStatus ?? ""],
      ["Sudah bisa berenang", (m) => m.canSwim ?? ""],
      ["Trauma air", (m) => m.waterTrauma ?? ""],
      ["Riwayat penyakit", (m) => m.healthNotes ?? ""],
      ["Pelatih renang", (m) => m.isSwimCoach ?? ""],
      ["Kenal MSS dari", (m) => m.knowFrom ?? ""],
      ["Motivasi", (m) => m.reason ?? ""],
      ["No WhatsApp", (m) => m.phone ?? ""],
      ["Jumlah hadir", (m) => String(m.attendanceCount)],
      ["Terdaftar", (m) => (m.createdAt ? new Date(m.createdAt).toLocaleDateString("id-ID") : "")],
    ];
    const rows = [kolom.map((k) => k[0]), ...shown.map((m) => kolom.map((k) => k[1](m)))];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `member-mss-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function kirimLinkPusat(m: Member) {
    try {
      const d = await api<{ url: string }>(`/api/admin/members/${m.id}/pusat-link`);
      const wa = m.phone ? m.phone.replace(/\D/g, "").replace(/^0/, "62") : "";
      const teks = encodeURIComponent(
        `Assalamualaikum ${m.name}, selamat sudah jadi member MSS Bangkalan! ` +
          `Satu langkah lagi: lengkapi pendataan MSS Pusat lewat tautan ini ya (isian sudah otomatis terisi):\n${d.url}`
      );
      window.open(wa ? `https://wa.me/${wa}?text=${teks}` : `https://wa.me/?text=${teks}`, "_blank");
    } catch (err) {
      setError((err as Error).message);
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
        <h1 className="text-lg font-bold">Member</h1>
        <button onClick={unduhCsv} className="btn btn-ghost ml-auto">
          Unduh CSV
        </button>
        <button onClick={() => setShowImpor((v) => !v)} className="btn btn-ghost">
          {showImpor ? "Tutup impor" : "Impor CSV"}
        </button>
        <button onClick={() => setShowForm((v) => !v)} className="btn btn-primary">
          {showForm ? "Batal" : "+ Tambah"}
        </button>
      </div>

      {showImpor && (
        <ImporMember
          api={api}
          onSelesai={() =>
            api<{ members: Member[] }>("/api/admin/members")
              .then((d) => setMembers(d.members))
              .catch(() => {})
          }
        />
      )}

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
              {busy ? "Menyimpan…" : "Simpan sebagai calon member"}
            </button>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Status naik otomatis jadi <b>member</b> begitu yang bersangkutan tercatat hadir di
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
            {f === "semua" ? "Semua" : f === "member" ? "Member" : "Calon member"}
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
              <Fragment key={m.id}>
              <tr className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => setBuka(buka === m.id ? "" : m.id)}
                    className="text-left font-medium hover:text-[var(--accent)]"
                  >
                    {buka === m.id ? "▾ " : "▸ "}
                    {m.name}
                    {m.nickname ? (
                      <span className="font-normal text-[var(--muted)]"> ({m.nickname})</span>
                    ) : null}
                  </button>
                  {m.phone && <div className="text-xs text-[var(--muted)]">{m.phone}</div>}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs">{m.code}</td>
                <td className="px-4 py-2.5">
                  <span className={`badge ${m.status === "member" ? "badge-member" : "badge-calon"}`}>
                    {m.status === "member" ? "MEMBER" : "CALON"}
                  </span>
                  {m.status === "member" && !m.pusatOpenedAt && (
                    <span className="badge ml-1 bg-amber-100 text-amber-800">BELUM LAPOR</span>
                  )}
                  {m.isSwimCoach === "Ya" && (
                    <span className="badge ml-1 bg-[var(--accent-soft)] text-[var(--accent)]">
                      PELATIH
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5">{m.attendanceCount}×</td>
                <td className="px-4 py-2.5 text-xs text-[var(--muted)]">
                  {m.lastAttendedAt ? new Date(m.lastAttendedAt).toLocaleDateString("id-ID") : "—"}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <Link href={`/kartu/${m.code}`} className="text-xs text-[var(--accent)]">
                    Kartu QR
                  </Link>
                  {m.status === "member" && !m.pusatOpenedAt && (
                    <button
                      onClick={() => kirimLinkPusat(m)}
                      className="ml-3 text-xs text-[var(--accent)]"
                      title="Kirim tautan pendataan MSS Pusat lewat WhatsApp"
                    >
                      Link pusat
                    </button>
                  )}
                  <button
                    onClick={() => hapus(m)}
                    className="ml-3 text-xs text-[var(--muted)] hover:text-[var(--danger)]"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
              {buka === m.id && (
                <tr className="border-b border-[var(--line)] bg-[var(--accent-soft)]/40">
                  <td colSpan={6} className="px-4 py-3">
                    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                      <Baris label="Usia" value={m.age} />
                      <Baris label="Jenis kelamin" value={m.gender} />
                      <Baris label="Agama" value={m.religion} />
                      <Baris label="Status pernikahan" value={m.maritalStatus} />
                      <Baris label="Alamat domisili" value={m.address} />
                      <Baris label="Pekerjaan" value={m.job} />
                      <Baris label="Sudah bisa berenang" value={m.canSwim} />
                      <Baris label="Trauma air" value={m.waterTrauma} />
                      <Baris label="Riwayat penyakit" value={m.healthNotes} penting />
                      <Baris label="Pelatih renang" value={m.isSwimCoach} />
                      <Baris label="Kenal MSS dari" value={m.knowFrom} />
                      <Baris label="Motivasi" value={m.reason} />
                      <Baris
                        label="Terdaftar"
                        value={
                          m.createdAt ? new Date(m.createdAt).toLocaleDateString("id-ID") : ""
                        }
                      />
                      <Baris label="Tempat lahir" value={m.birthPlace} />
                      <Baris label="Tanggal lahir" value={m.birthDate} />
                      <Baris label="Kecamatan" value={m.district} />
                      <Baris label="Kabupaten/Kota" value={m.city} />
                      <Baris label="Provinsi" value={m.province} />
                      <Baris label="Catatan pengurus" value={m.note} />
                    </dl>
                  </td>
                </tr>
              )}
              </Fragment>
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

function Baris({
  label,
  value,
  penting,
}: {
  label: string;
  value?: string;
  penting?: boolean;
}) {
  const isi = (value ?? "").trim();
  const perluPerhatian =
    penting && isi !== "" && !/^(tidak ada|tidak|-|nihil|none)$/i.test(isi);
  return (
    <div className="flex gap-2 text-sm">
      <dt className="w-40 shrink-0 text-xs uppercase tracking-wide text-[var(--muted)]">
        {label}
      </dt>
      <dd className={perluPerhatian ? "font-semibold text-[var(--danger)]" : ""}>{isi || "—"}</dd>
    </div>
  );
}
