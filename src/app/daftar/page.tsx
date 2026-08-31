"use client";

import Link from "next/link";
import { useState } from "react";

export default function DaftarPage() {
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/public/daftar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mendaftar.");
      setCode(data.code);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (code) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
        <div className="panel p-6 text-center">
          <p className="text-3xl">✓</p>
          <h1 className="mt-2 text-xl font-bold">Pendaftaran diterima</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Simpan kode anggotamu. Tunjukkan kode ini kalau pengurus meminta saat latihan pertama.
          </p>
          <p className="my-4 font-mono text-2xl font-black tracking-widest text-[var(--accent)]">
            {code}
          </p>
          <p className="text-xs text-[var(--muted)]">
            Statusmu sekarang <b>calon anggota</b> dan naik jadi <b>anggota</b> setelah hadir di
            latihan pertama.
          </p>
          <Link href="/" className="btn btn-ghost mt-5">
            Kembali
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="MSS" width={80} height={80} className="mb-4" />
      <h1 className="wordmark text-2xl">Daftar Calon Anggota</h1>
      <p className="mt-1 mb-6 text-sm text-[var(--muted)]">
        Muslimah Swimming Squad — Chapter Bangkalan
      </p>

      <form onSubmit={submit} className="panel space-y-3 p-5">
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
            required
            inputMode="tel"
            placeholder="08xxxxxxxxxx"
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
          <label className="label">Catatan (opsional)</label>
          <input
            className="field"
            placeholder="mis. diajak oleh…"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <button disabled={busy} className="btn btn-primary w-full">
          {busy ? "Mengirim…" : "Kirim pendaftaran"}
        </button>
      </form>
    </main>
  );
}
