"use client";

import { useState } from "react";
import { ADMIN_CONTACTS, waLink } from "@/lib/config";

type Sukses = { code: string; name: string; adminPhone: string };

export function FormDaftar() {
  const [form, setForm] = useState({
    nama: "",
    whatsapp: "",
    pekerjaan: "",
    alasan: "",
    admin: ADMIN_CONTACTS[0]?.phone ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState<Sukses | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/public/daftar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "web" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.message ?? "Gagal mendaftar.");
      setSukses({ code: data.code, name: form.nama, adminPhone: form.admin });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (sukses) {
    const pesan = `Assalamualaikum Admin, saya sudah mengisi form pendaftaran di website atas nama ${sukses.name} (kode ${sukses.code}). Mohon konfirmasinya ya, syukron!`;
    return (
      <div className="text-center">
        <p className="text-3xl">🎉</p>
        <h3 className="mt-2 text-lg font-bold">Barakallah, pendaftaran tersimpan!</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Simpan kode anggotamu, tunjukkan ke pengurus saat latihan pertama.
        </p>
        <p className="my-4 font-mono text-2xl font-black tracking-widest text-[var(--accent)]">
          {sukses.code}
        </p>
        <a
          href={waLink(sukses.adminPhone, pesan)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary w-full"
        >
          Lanjut konfirmasi ke WhatsApp admin
        </a>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Statusmu sekarang <b>calon anggota</b>, naik jadi <b>anggota</b> setelah hadir di latihan
          pertama.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label" htmlFor="nama">
          Nama lengkap
        </label>
        <input
          id="nama"
          required
          className="field"
          value={form.nama}
          onChange={(e) => setForm({ ...form, nama: e.target.value })}
        />
      </div>
      <div>
        <label className="label" htmlFor="wa">
          No. WhatsApp aktif
        </label>
        <input
          id="wa"
          required
          inputMode="tel"
          placeholder="Contoh: 08123456xxx"
          className="field"
          value={form.whatsapp}
          onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
        />
      </div>
      <div>
        <label className="label" htmlFor="kerja">
          Pekerjaan / aktivitas
        </label>
        <input
          id="kerja"
          required
          className="field"
          value={form.pekerjaan}
          onChange={(e) => setForm({ ...form, pekerjaan: e.target.value })}
        />
      </div>
      <div>
        <label className="label" htmlFor="adm">
          Pilih admin koordinasi
        </label>
        <select
          id="adm"
          className="field"
          value={form.admin}
          onChange={(e) => setForm({ ...form, admin: e.target.value })}
        >
          {ADMIN_CONTACTS.map((a) => (
            <option key={a.phone} value={a.phone}>
              {a.name} ({a.role})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="alasan">
          Alasan ingin bergabung
        </label>
        <textarea
          id="alasan"
          required
          rows={3}
          className="field"
          value={form.alasan}
          onChange={(e) => setForm({ ...form, alasan: e.target.value })}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button disabled={busy} className="btn btn-primary w-full">
        {busy ? "Mengirim…" : "Kirim data pendaftaran"}
      </button>
    </form>
  );
}
