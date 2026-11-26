"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdmin } from "@/components/useAdmin";
import type { Pelatih } from "@/lib/types";

export default function PelatihPage() {
  return (
    <AdminShell>
      <Daftar />
    </AdminShell>
  );
}

function Daftar() {
  const { user, api } = useAdmin();
  const [items, setItems] = useState<Pelatih[]>([]);
  const [q, setQ] = useState("");
  const [buka, setBuka] = useState("");
  const [error, setError] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);
  const link = `${origin}/daftar-rp`;

  useEffect(() => {
    if (!user) return;
    api<{ pelatih: Pelatih[] }>("/api/admin/pelatih")
      .then((d) => setItems(d.pelatih))
      .catch((e) => setError(e.message));
  }, [user, api]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return items.filter(
      (p) =>
        !n ||
        p.name.toLowerCase().includes(n) ||
        p.code.toLowerCase().includes(n) ||
        (p.phone ?? "").includes(n)
    );
  }, [items, q]);

  async function hapus(p: Pelatih) {
    if (!confirm(`Hapus ${p.name}? Disembunyikan (masuk menu Sampah) dan bisa dipulihkan kapan saja.`)) return;
    try {
      await api(`/api/admin/pelatih/${p.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-lg font-bold">Relawan Pelatih</h1>
        <span className="text-xs text-[var(--muted)]">{items.length} orang</span>
        <button onClick={() => setShowLink((v) => !v)} className="btn btn-primary ml-auto">
          {showLink ? "Tutup link pendataan" : "Link pendataan RP"}
        </button>
      </div>

      {showLink && (
        <div className="panel p-4">
          <p className="mb-1 text-sm font-bold">Link pendataan Relawan Pelatih</p>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Khusus pelatih yang sudah ikut TFT. Begitu mengisi, langsung tercatat sebagai RP dan
            mendapat kartu QR presensi pelatih. Bagikan manual lewat WhatsApp.
          </p>
          <p className="mb-2 break-all rounded-lg bg-[var(--accent-soft)] p-2 font-mono text-xs">{link}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigator.clipboard?.writeText(link)}
              className="btn btn-ghost px-3 py-1 text-xs"
            >
              Salin link
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Assalamualaikum, mohon isi pendataan Relawan Pelatih MSS Chapter Bangkalan lewat link ini ya:\n${link}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary px-3 py-1 text-xs"
            >
              Bagikan lewat WhatsApp
            </a>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <input
        placeholder="Cari nama / kode / HP…"
        className="field max-w-72"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="panel overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--line)]">
              <th className="px-4 py-2.5">Nama</th>
              <th className="px-4 py-2.5">Kode</th>
              <th className="px-4 py-2.5">TFT</th>
              <th className="px-4 py-2.5">Hadir</th>
              <th className="px-4 py-2.5 text-right"> </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <Fragment key={p.id}>
                <tr className="border-b border-[var(--line)]">
                  <td className="px-4 py-2.5">
                    <button onClick={() => setBuka(buka === p.id ? "" : p.id)} className="text-left font-semibold">
                      {buka === p.id ? "▾" : "▸"} {p.name}
                      {p.nickname ? ` (${p.nickname})` : ""}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">{p.code}</td>
                  <td className="px-4 py-2.5 text-xs">{p.tftInfo || "—"}</td>
                  <td className="px-4 py-2.5">{p.attendanceCount}×</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <Link href={`/kartu/${p.code}`} className="text-xs text-[var(--accent)]">
                      Kartu QR
                    </Link>
                    <button
                      onClick={() => hapus(p)}
                      className="ml-3 text-xs text-[var(--muted)] hover:text-[var(--danger)]"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
                {buka === p.id && (
                  <tr className="border-b border-[var(--line)] bg-[var(--accent-soft)]/40">
                    <td colSpan={5} className="px-4 py-3">
                      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 text-sm">
                        <Baris label="No. WhatsApp" value={p.phone} />
                        <Baris label="Usia" value={p.age} />
                        <Baris label="Jenis kelamin" value={p.gender} />
                        <Baris label="Agama" value={p.religion} />
                        <Baris label="Status pernikahan" value={p.maritalStatus} />
                        <Baris label="Pekerjaan" value={p.job} />
                        <Baris label="Tempat lahir" value={p.birthPlace} />
                        <Baris label="Tanggal lahir" value={p.birthDate} />
                        <Baris label="Alamat lengkap" value={p.address} />
                        <Baris label="Kecamatan" value={p.district} />
                        <Baris label="Kabupaten/Kota" value={p.city} />
                        <Baris label="Provinsi" value={p.province} />
                        <Baris label="Tahun / angkatan TFT" value={p.tftInfo} />
                        <Baris label="Terdaftar" value={p.createdAt ? new Date(p.createdAt).toLocaleDateString("id-ID") : ""} />
                      </dl>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-[var(--muted)]">
                  Belum ada relawan pelatih.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Baris({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--muted)]">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}
