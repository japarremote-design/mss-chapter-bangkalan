"use client";

import { useEffect, useState } from "react";

const LABEL: Record<string, { label: string; type?: string; placeholder?: string }> = {
  birthPlace: { label: "Tempat lahir", placeholder: "mis. Bangkalan" },
  birthDate: { label: "Tanggal lahir", type: "date" },
  district: { label: "Kecamatan" },
  city: { label: "Kabupaten/Kota", placeholder: "mis. Bangkalan" },
  province: { label: "Provinsi", placeholder: "mis. Jawa Timur" },
};

type Status = { aktif: boolean; name?: string; kurang?: string[]; sudahDibuka?: boolean };

/**
 * Langkah lanjutan setelah latihan perdana: lengkapi data yang diminta
 * MSS Pusat, lalu buka formulir pusat yang sudah terisi otomatis.
 */
export function PusatLangkah({ memberId, token }: { memberId: string; token: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [isi, setIsi] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    fetch(`/api/public/pusat?memberId=${memberId}&k=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setStatus(d.aktif ? d : { aktif: false }))
      .catch(() => setStatus({ aktif: false }));
  }, [memberId, token]);

  if (!status?.aktif) return null;

  const kurang = status.kurang ?? [];

  async function lanjut(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/public/pusat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, token, ...isi }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setUrl(d.url);
      window.open(d.url, "_blank", "noopener");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (url) {
    return (
      <div className="panel mt-4 p-5 text-left">
        <p className="text-sm font-bold">Satu langkah lagi 🎯</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Formulir MSS Pusat sudah terbuka di tab baru dengan jawaban terisi otomatis. Periksa
          sebentar, lalu tekan <b>Kirim</b> di sana.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary mt-3 w-full"
        >
          Buka lagi formulir MSS Pusat
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={lanjut} className="panel mt-4 p-5 text-left">
      <p className="text-sm font-bold">Lapor ke MSS Pusat</p>
      <p className="mt-1 mb-4 text-sm text-[var(--muted)]">
        Sebagai member baru, datamu perlu didaftarkan ke MSS Pusat.
        {kurang.length > 0
          ? " Lengkapi beberapa isian ini — sisanya sudah kami isikan otomatis."
          : " Semua datamu sudah lengkap, tinggal buka formulirnya."}
      </p>

      {kurang.map((f) => {
        const meta = LABEL[f] ?? { label: f };
        return (
          <div key={f} className="mb-3">
            <label className="label" htmlFor={`pusat-${f}`}>
              {meta.label}
            </label>
            <input
              id={`pusat-${f}`}
              required
              type={meta.type ?? "text"}
              placeholder={meta.placeholder}
              className="field"
              value={isi[f] ?? ""}
              onChange={(e) => setIsi({ ...isi, [f]: e.target.value })}
            />
          </div>
        );
      })}

      {error && <p className="mb-3 text-sm text-[var(--danger)]">{error}</p>}

      <button disabled={busy} className="btn btn-primary w-full">
        {busy ? "Menyiapkan…" : "Buka formulir MSS Pusat"}
      </button>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Formulirnya akan terbuka sudah terisi — kamu tinggal menekan Kirim.
      </p>
    </form>
  );
}
