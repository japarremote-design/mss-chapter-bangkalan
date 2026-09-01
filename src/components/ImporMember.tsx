"use client";

import { useState } from "react";

/** Nama kolom yang dikenali → nama isian di app. Semuanya dicocokkan huruf kecil. */
const PETA: Record<string, string> = {
  "nama lengkap": "name",
  nama: "name",
  name: "name",
  "nama panggilan": "nickname",
  panggilan: "nickname",
  "no wa": "phone",
  "no. wa": "phone",
  "no whatsapp": "phone",
  "no. whatsapp": "phone",
  "nomor whatsapp": "phone",
  whatsapp: "phone",
  wa: "phone",
  hp: "phone",
  "no hp": "phone",
  telepon: "phone",
  phone: "phone",
  status: "status",
  usia: "age",
  umur: "age",
  "jenis kelamin": "gender",
  agama: "religion",
  "alamat domisili": "address",
  alamat: "address",
  pekerjaan: "job",
  "status pernikahan": "maritalStatus",
  "sudah bisa berenang": "canSwim",
  "bisa berenang": "canSwim",
  "sudah bisa berenang?": "canSwim",
  "punya trauma air": "waterTrauma",
  "punya trauma air?": "waterTrauma",
  "trauma air": "waterTrauma",
  "riwayat penyakit": "healthNotes",
  "apakah anda seorang pelatih renang?": "isSwimCoach",
  "pelatih renang": "isSwimCoach",
  "kenal mss melalui": "knowFrom",
  "kenal mss dari": "knowFrom",
  "motivasi bergabung bersama mss": "reason",
  motivasi: "reason",
  "alasan bergabung": "reason",
  alasan: "reason",
  "tempat lahir": "birthPlace",
  "tanggal lahir": "birthDate",
  kecamatan: "district",
  "kabupaten/kota": "city",
  kabupaten: "city",
  kota: "city",
  provinsi: "province",
  "jumlah hadir": "attendanceCount",
  hadir: "attendanceCount",
  catatan: "note",
  timestamp: "createdAt",
  waktu: "createdAt",
  terdaftar: "createdAt",
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === "," || c === ";" || c === "\t") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (c !== "\r") cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

type Hasil = { masuk: number; dilewati: string[] };

export function ImporMember({
  api,
  onSelesai,
}: {
  api: <T>(url: string, init?: RequestInit) => Promise<T>;
  onSelesai: () => void;
}) {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [takDikenal, setTakDikenal] = useState<string[]>([]);
  const [namaFile, setNamaFile] = useState("");
  const [error, setError] = useState("");
  const [progres, setProgres] = useState(0);
  const [busy, setBusy] = useState(false);
  const [hasil, setHasil] = useState<Hasil | null>(null);

  function baca(file: File) {
    setError("");
    setHasil(null);
    setNamaFile(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const isi = String(reader.result ?? "").replace(/^﻿/, "");
        const tabel = parseCsv(isi);
        if (tabel.length < 2) throw new Error("File tidak berisi data.");

        const header = tabel[0].map((h) => h.trim());
        const kunci = header.map((h) => PETA[h.toLowerCase()] ?? "");
        const tidakDipakai = header.filter((_, i) => !kunci[i]);

        const data = tabel.slice(1).map((baris) => {
          const obj: Record<string, string> = {};
          kunci.forEach((k, i) => {
            if (k) obj[k] = (baris[i] ?? "").trim();
          });
          return obj;
        });

        const bernama = data.filter((d) => (d.name ?? "").trim().length >= 2);
        if (bernama.length === 0) {
          throw new Error(
            "Kolom nama tidak ditemukan. Pastikan ada kolom berjudul 'Nama Lengkap' atau 'Nama'."
          );
        }

        setRows(bernama);
        setTakDikenal(tidakDipakai);
      } catch (err) {
        setRows([]);
        setError((err as Error).message);
      }
    };
    reader.readAsText(file);
  }

  async function impor() {
    setBusy(true);
    setError("");
    setProgres(0);
    const kumpulan: Hasil = { masuk: 0, dilewati: [] };

    try {
      const POTONG = 200;
      for (let i = 0; i < rows.length; i += POTONG) {
        const d = await api<Hasil>("/api/admin/members/import", {
          method: "POST",
          body: JSON.stringify({ rows: rows.slice(i, i + POTONG) }),
        });
        kumpulan.masuk += d.masuk;
        kumpulan.dilewati.push(...d.dilewati);
        setProgres(Math.min(rows.length, i + POTONG));
      }
      setHasil(kumpulan);
      setRows([]);
      onSelesai();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const jumlahMember = rows.filter(
    (r) => (r.status ?? "").toLowerCase().startsWith("member") || Number(r.attendanceCount) > 0
  ).length;

  return (
    <div className="panel space-y-4 p-4">
      <div>
        <h2 className="font-bold">Impor data dari CSV</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Dari Google Sheet: <b>File → Download → Comma-separated values (.csv)</b>. Judul kolom
          dikenali otomatis — Nama Lengkap, No WA, Status, Usia, Alamat, dan seterusnya.
        </p>
      </div>

      <input
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) baca(f);
        }}
        className="field"
      />

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {rows.length > 0 && (
        <>
          <div className="rounded-xl bg-[var(--accent-soft)] p-3 text-sm">
            <p>
              <b>{rows.length} baris</b> terbaca dari {namaFile} —{" "}
              <span className="text-[var(--muted)]">
                {jumlahMember} akan masuk sebagai member, {rows.length - jumlahMember} sebagai calon
                member.
              </span>
            </p>
            {takDikenal.length > 0 && (
              <p className="mt-1 text-xs text-[var(--muted)]">
                Kolom yang tidak dikenali dan akan diabaikan: {takDikenal.join(", ")}
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--line)] text-left text-[var(--muted)]">
                  <th className="py-2 pr-3">Nama</th>
                  <th className="py-2 pr-3">WhatsApp</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Alamat</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((r, i) => (
                  <tr key={i} className="border-b border-[var(--line)] last:border-0">
                    <td className="py-2 pr-3 font-medium">{r.name}</td>
                    <td className="py-2 pr-3">{r.phone || "—"}</td>
                    <td className="py-2 pr-3">
                      {(r.status ?? "").toLowerCase().startsWith("member") ||
                      Number(r.attendanceCount) > 0
                        ? "member"
                        : "calon"}
                    </td>
                    <td className="py-2">{r.address || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && (
              <p className="mt-2 text-xs text-[var(--muted)]">
                …dan {rows.length - 5} baris lainnya.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={impor} disabled={busy} className="btn btn-primary">
              {busy ? `Mengimpor… ${progres}/${rows.length}` : `Impor ${rows.length} baris`}
            </button>
            <button
              onClick={() => {
                setRows([]);
                setNamaFile("");
              }}
              disabled={busy}
              className="btn btn-ghost"
            >
              Batal
            </button>
            <span className="text-xs text-[var(--muted)]">
              Nomor WhatsApp yang sudah ada di database akan dilewati.
            </span>
          </div>
        </>
      )}

      {hasil && (
        <div className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-900">
          <p className="font-semibold">
            Selesai — {hasil.masuk} data masuk, {hasil.dilewati.length} dilewati.
          </p>
          {hasil.dilewati.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs">Lihat yang dilewati</summary>
              <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto text-xs">
                {hasil.dilewati.map((d, i) => (
                  <li key={i}>• {d}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
