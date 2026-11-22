"use client";

import { useState } from "react";
import { Qr } from "./Qr";

type Hasil = { code: string; name: string };

/**
 * "Sudah pernah isi tapi kehilangan QR-nya?" — pencarian ulang pakai nama +
 * no. WhatsApp yang dipakai saat mengisi, supaya member tidak perlu hubungi
 * admin cuma untuk ambil ulang QR presensinya.
 */
export function CariKodeMember() {
  const [buka, setBuka] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hasil, setHasil] = useState<Hasil | null>(null);

  async function cari(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setHasil(null);
    try {
      const res = await fetch("/api/public/cari-kode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Tidak ditemukan.");
      setHasil({ code: data.code, name: data.name });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel mb-5 overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setBuka((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <span className="text-sm font-bold">
          Sudah pernah isi, tapi QR-nya hilang? Cari lagi di sini
        </span>
        <span className="text-[var(--muted)]">{buka ? "▲" : "▼"}</span>
      </button>

      {buka && (
        <div className="border-t border-[var(--line)] p-4">
          {!hasil ? (
            <form onSubmit={cari} className="space-y-3">
              <div>
                <label className="label" htmlFor="ck-nama">
                  Nama lengkap
                </label>
                <input
                  id="ck-nama"
                  className="field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="ck-wa">
                  No. WhatsApp yang dipakai saat mengisi
                </label>
                <input
                  id="ck-wa"
                  className="field"
                  inputMode="tel"
                  placeholder="08123456xxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-700">{error}</p>}
              <button disabled={busy} className="btn btn-primary w-full">
                {busy ? "Mencari…" : "Cari QR-ku"}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-sm">
                Ketemu, <b>{hasil.name}</b>:
              </p>
              <div className="mt-3 flex justify-center">
                <div className="rounded-xl bg-white p-3">
                  <Qr value={hasil.code} size={180} />
                </div>
              </div>
              <p className="mt-2 font-mono text-base font-black tracking-widest text-[var(--accent)]">
                {hasil.code}
              </p>
              <button
                type="button"
                onClick={() => {
                  setHasil(null);
                  setName("");
                  setPhone("");
                }}
                className="btn btn-ghost mt-3 px-3 py-1 text-xs"
              >
                Cari yang lain
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
