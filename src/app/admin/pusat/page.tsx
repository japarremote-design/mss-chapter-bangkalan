"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdmin } from "@/components/useAdmin";
import type { PusatConfig, PusatEntry } from "@/lib/types";

export default function PusatAdminPage() {
  return (
    <AdminShell>
      <Pusat />
    </AdminShell>
  );
}

type FieldOpt = { key: string; label: string };

function Pusat() {
  const { user, api } = useAdmin();
  const [fields, setFields] = useState<FieldOpt[]>([]);
  const [formUrl, setFormUrl] = useState("");
  const [entries, setEntries] = useState<PusatEntry[]>([]);
  const [tautan, setTautan] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    api<{ config: PusatConfig | null; fields: FieldOpt[] }>("/api/admin/pusat")
      .then((d) => {
        setFields(d.fields);
        if (d.config) {
          setFormUrl(d.config.formUrl);
          setEntries(d.config.entries);
        }
      })
      .catch((e) => setError(e.message));
  }, [user, api]);

  async function baca(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const d = await api<{ formUrl: string; entries: PusatEntry[] }>("/api/admin/pusat", {
        method: "PUT",
        body: JSON.stringify({ url: tautan }),
      });
      setFormUrl(d.formUrl);
      setEntries(d.entries);
      setTautan("");
      setInfo(
        `${d.entries.length} pertanyaan terbaca. Pasangkan tiap pertanyaan dengan isian di app, lalu simpan.`
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function simpan() {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await api("/api/admin/pusat", {
        method: "POST",
        body: JSON.stringify({ formUrl, entries }),
      });
      setInfo("Tersimpan. Member baru akan langsung mendapat formulir pusat yang sudah terisi.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function putus() {
    if (!confirm("Putuskan sambungan ke formulir MSS Pusat?")) return;
    try {
      await api("/api/admin/pusat", { method: "DELETE" });
      setFormUrl("");
      setEntries([]);
      setInfo("Sambungan diputus. Member tidak lagi diminta mengisi formulir pusat.");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const terpakai = entries.filter((e) => e.field).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold">Sambungan ke Formulir MSS Pusat</h1>
        <p className="text-xs text-[var(--muted)]">
          Supaya member baru tidak mengisi dua kali: data dari app dikirim sebagai isian otomatis ke
          formulir pusat, member tinggal menekan Kirim.
        </p>
      </div>

      <details className="panel p-4 text-sm" open={entries.length === 0}>
        <summary className="cursor-pointer font-semibold">
          Cara mengambil tautan isian otomatis
        </summary>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[var(--muted)]">
          <li>Buka formulir MSS Pusat dalam mode edit (harus punya akses edit dari pusat).</li>
          <li>
            Klik menu titik tiga di kanan atas → <b>Dapatkan tautan isian otomatis</b> (Get
            pre-filled link).
          </li>
          <li>
            Isi setiap pertanyaan dengan contoh yang mudah dikenali — mis. ketik{" "}
            <code>NAMA</code> di Nama Lengkap, <code>KECAMATAN</code> di Kecamatan.
          </li>
          <li>
            Tekan <b>Dapatkan tautan</b> → <b>Salin tautan</b>, lalu tempel di bawah ini.
          </li>
        </ol>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Kalau pusat mengubah formulirnya, ulangi langkah ini. Pertanyaan yang tidak berubah tetap
          memakai pemetaan lama.
        </p>
      </details>

      <form onSubmit={baca} className="panel space-y-3 p-4">
        <div>
          <label className="label">Tautan isian otomatis dari Google Form</label>
          <input
            className="field"
            placeholder="https://docs.google.com/forms/d/e/.../viewform?usp=pp_url&entry.123=NAMA…"
            value={tautan}
            onChange={(e) => setTautan(e.target.value)}
          />
        </div>
        <button disabled={busy || !tautan.trim()} className="btn btn-primary">
          {busy ? "Membaca…" : "Baca pertanyaan"}
        </button>
      </form>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {info && (
        <p className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          {info}
        </p>
      )}

      {entries.length > 0 && (
        <div className="panel p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="font-bold">Pemetaan pertanyaan</h2>
            <span className="text-xs text-[var(--muted)]">
              {terpakai} dari {entries.length} dipasangkan
            </span>
            <button onClick={putus} className="ml-auto text-xs text-[var(--danger)]">
              Putuskan sambungan
            </button>
          </div>

          <p className="mb-3 break-all rounded-lg bg-[var(--accent-soft)] p-2 font-mono text-xs">
            {formUrl}
          </p>

          <div className="space-y-2">
            {entries.map((e, i) => (
              <div key={e.entryId} className="grid gap-2 sm:grid-cols-2 sm:items-center">
                <div className="text-sm">
                  <span className="font-medium">{e.sample || "(contoh kosong)"}</span>
                  <span className="ml-2 font-mono text-xs text-[var(--muted)]">
                    entry.{e.entryId}
                    {e.type === "date" ? " · tanggal" : ""}
                  </span>
                </div>
                <select
                  className="field"
                  value={e.field}
                  onChange={(ev) =>
                    setEntries(
                      entries.map((x, j) => (i === j ? { ...x, field: ev.target.value } : x))
                    )
                  }
                >
                  {fields.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button onClick={simpan} disabled={busy} className="btn btn-primary mt-4">
            {busy ? "Menyimpan…" : "Simpan pemetaan"}
          </button>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Isian yang belum ada datanya (tempat &amp; tanggal lahir, kecamatan, kabupaten,
            provinsi) akan ditanyakan ke member sendiri setelah latihan perdananya.
          </p>
        </div>
      )}
    </div>
  );
}
