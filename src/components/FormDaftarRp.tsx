"use client";

import { useMemo, useState } from "react";
import { Qr } from "./Qr";

type Sukses = { code: string; name: string };

const KOSONG = {
  name: "",
  nickname: "",
  age: "",
  gender: "",
  religion: "",
  address: "",
  district: "",
  city: "Bangkalan",
  province: "Jawa Timur",
  birthPlace: "",
  birthDate: "",
  job: "",
  maritalStatus: "",
  tftSudah: "",
  phone: "",
};

type Field = keyof typeof KOSONG;

const NAMA_FIELD: Record<Field, string> = {
  name: "nama lengkap",
  nickname: "nama panggilan",
  age: "usia",
  gender: "jenis kelamin",
  religion: "agama",
  address: "alamat lengkap",
  district: "kecamatan",
  city: "kabupaten/kota",
  province: "provinsi",
  birthPlace: "tempat lahir",
  birthDate: "tanggal lahir",
  job: "pekerjaan",
  maritalStatus: "status pernikahan",
  tftSudah: "sudah ikut TFT?",
  phone: "no. WhatsApp",
};

const LANGKAH: { judul: string; sub: string; fields: Field[] }[] = [
  {
    judul: "Kenalan dulu",
    sub: "Data diri relawan pelatih.",
    fields: ["name", "nickname", "birthPlace", "birthDate", "age", "gender", "religion", "maritalStatus", "job"],
  },
  {
    judul: "Alamat",
    sub: "Tempat tinggalmu sekarang.",
    fields: ["address", "district", "city", "province"],
  },
  {
    judul: "TFT & kontak",
    sub: "Syarat relawan pelatih: sudah ikut TFT.",
    fields: ["tftSudah", "phone"],
  },
];

/**
 * Form pendataan Relawan Pelatih (RP). Langsung tercatat sebagai RP
 * (daftar terpisah dari member). Jangan pasang link di beranda — bagikan
 * manual ke calon RP lewat WhatsApp.
 */
export function FormDaftarRp() {
  const [form, setForm] = useState(KOSONG);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState<Sukses | null>(null);

  const [tft, setTft] = useState<TftBaris[]>([{ tahun: "", level: "", batch: "" }]);

  const set = (k: Field, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setBaris = (i: number, k: keyof TftBaris, v: string) =>
    setTft((rows) => rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  const tftLengkap = tft.every((r) => r.tahun && r.level && /^\d{1,3}$/.test(r.batch));

  const kurang = useMemo(() => {
    const k = LANGKAH[step].fields.filter((f) => form[f].trim() === "").map((f) => NAMA_FIELD[f]);
    if (step === 2 && !tftLengkap) k.push("tahun, level, dan batch TFT");
    return k;
  }, [form, step, tftLengkap]);
  const terisi = kurang.length === 0;

  const progres = useMemo(() => {
    const semua = LANGKAH.flatMap((l) => l.fields);
    return Math.round((semua.filter((f) => form[f].trim() !== "").length / semua.length) * 100);
  }, [form]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step < LANGKAH.length - 1) {
      setStep((s) => s + 1);
      window.scrollTo({
        top: document.getElementById("form-daftar-rp")?.offsetTop ?? 0,
        behavior: "smooth",
      });
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/public/daftar-rp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.message ?? "Gagal menyimpan data.");
      setSukses({ code: data.code, name: form.name });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (sukses) return <Selesai sukses={sukses} />;

  const l = LANGKAH[step];

  return (
    <div id="form-daftar-rp" className="panel overflow-hidden p-0">
      <div className="bg-gradient-to-br from-[#0f6fb0] to-[#12468f] px-5 pt-5 pb-4 text-white">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider opacity-90">
          <span>
            Langkah {step + 1} dari {LANGKAH.length}
          </span>
          <span>{progres}% lengkap</span>
        </div>
        <h3 className="mt-2 text-xl font-bold">{l.judul}</h3>
        <p className="mt-1 text-sm opacity-90">{l.sub}</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${progres}%` }}
          />
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5 p-5">
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {step === 0 && (
          <>
            <Teks label="Nama lengkap" value={form.name} onChange={(v) => set("name", v)} />
            <Teks
              label="Nama panggilan"
              value={form.nickname}
              onChange={(v) => set("nickname", v)}
              hint="Yang biasa dipakai sehari-hari."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Teks
                label="Tempat lahir"
                value={form.birthPlace}
                onChange={(v) => set("birthPlace", v)}
                placeholder="mis. Bangkalan"
              />
              <Teks
                label="Tanggal lahir"
                value={form.birthDate}
                onChange={(v) => set("birthDate", v)}
                type="date"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Teks
                label="Usia"
                value={form.age}
                onChange={(v) => set("age", v)}
                inputMode="numeric"
                placeholder="mis. 24"
              />
              <Teks
                label="Status pernikahan"
                value={form.maritalStatus}
                onChange={(v) => set("maritalStatus", v)}
                placeholder="mis. Belum menikah"
              />
            </div>
            <Pilihan
              label="Jenis kelamin"
              value={form.gender}
              onChange={(v) => set("gender", v)}
              options={["Perempuan", "Laki-laki"]}
            />
            <Teks label="Agama" value={form.religion} onChange={(v) => set("religion", v)} />
            <Teks label="Pekerjaan" value={form.job} onChange={(v) => set("job", v)} />
          </>
        )}

        {step === 1 && (
          <>
            <Teks
              label="Alamat lengkap"
              value={form.address}
              onChange={(v) => set("address", v)}
              placeholder="Jalan, RT/RW, kelurahan/desa"
              area
            />
            <Teks label="Kecamatan" value={form.district} onChange={(v) => set("district", v)} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Teks
                label="Kabupaten/Kota"
                value={form.city}
                onChange={(v) => set("city", v)}
              />
              <Teks label="Provinsi" value={form.province} onChange={(v) => set("province", v)} />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Pilihan
              label="Sudah ikut TFT (Training for Trainers)?"
              value={form.tftSudah}
              onChange={(v) => set("tftSudah", v)}
              options={["Ya", "Belum"]}
            />
            {form.tftSudah === "Belum" && (
              <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                Relawan pelatih wajib sudah mengikuti TFT.
              </p>
            )}
            <div className="space-y-3">
              <p className="label">Riwayat TFT (catat semua level yang sudah diikuti)</p>
              {tft.map((r, i) => (
                <div key={i} className="rounded-xl border border-[var(--line)] p-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Pilih
                      label="Tahun"
                      value={r.tahun}
                      onChange={(v) => setBaris(i, "tahun", v)}
                      options={TAHUN_TFT}
                    />
                    <Pilih
                      label="Level"
                      value={r.level}
                      onChange={(v) => setBaris(i, "level", v)}
                      options={["1", "2", "3", "4", "5"]}
                    />
                    <Teks
                      label="Batch"
                      value={r.batch}
                      onChange={(v) => setBaris(i, "batch", v)}
                      type="number"
                      inputMode="numeric"
                      placeholder="mis. 3"
                    />
                  </div>
                  {tft.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setTft((rows) => rows.filter((_, j) => j !== i))}
                      className="mt-2 text-xs text-[var(--muted)] hover:text-[var(--danger)]"
                    >
                      Hapus baris ini
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setTft((rows) => [...rows, { tahun: "", level: "", batch: "" }])}
                className="btn btn-ghost w-full text-sm"
              >
                + Tambah level TFT lain
              </button>
            </div>
            <Teks
              label="No. WhatsApp aktif"
              value={form.phone}
              onChange={(v) => set("phone", v)}
              inputMode="tel"
              placeholder="08123456xxxx"
            />
          </>
        )}

        <div className="flex items-center gap-3 border-t border-[var(--line)] pt-4">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="btn btn-ghost">
              ← Kembali
            </button>
          )}
          <button disabled={busy || !terisi || (step === 2 && form.tftSudah !== "Ya")} className="btn btn-primary ml-auto px-6">
            {busy ? "Menyimpan…" : step < LANGKAH.length - 1 ? "Lanjut →" : "Simpan data RP"}
          </button>
        </div>

        {!terisi && (
          <p className="text-center text-xs text-[var(--muted)]">
            Belum terisi: {kurang.join(", ")}.
          </p>
        )}
      </form>
    </div>
  );
}

function Selesai({ sukses }: { sukses: Sukses }) {
  return (
    <div className="panel overflow-hidden p-0">
      <div className="bg-gradient-to-br from-[#0f6fb0] to-[#12468f] px-6 py-8 text-center text-white">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-3xl">
          ✓
        </div>
        <h3 className="text-xl font-bold">Barakallah, data kamu tersimpan!</h3>
        <p className="mt-1 text-sm opacity-90">
          Kamu tercatat sebagai <b>relawan pelatih</b>, {sukses.name}.
        </p>
      </div>

      <div className="p-5">
        <div className="rounded-xl border border-dashed border-[var(--accent)] bg-[var(--accent-soft)] p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">QR presensi pelatih</p>
          <div className="mt-3 flex justify-center">
            <div className="rounded-xl bg-white p-3">
              <Qr value={sukses.code} size={200} />
            </div>
          </div>
          <p className="mt-3 font-mono text-lg font-black tracking-widest text-[var(--accent)]">
            {sukses.code}
          </p>
          <a
            href={`/kartu/${sukses.code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary mt-3 w-full"
          >
            Buka halaman kartu (buat disimpan/dicetak) →
          </a>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Cetak dari halaman kartu itu ya, jangan dari halaman ini. QR ini dipindai saat kamu
            melatih atau ikut kegiatan, supaya kehadiranmu tercatat.
          </p>
        </div>

      </div>
    </div>
  );
}

/** Tahun TFT dinamis: dari tahun berjalan mundur ke 2015, ikut bertambah tiap tahun. */
type TftBaris = { tahun: string; level: string; batch: string };

const TAHUN_TFT = Array.from(
  { length: Math.max(new Date().getFullYear() - 2015 + 1, 1) },
  (_, i) => String(new Date().getFullYear() - i)
);

function Pilih({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const id = `rp-pilih-${label.toLowerCase()}`;
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="field" required value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Pilih…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function Teks({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  hint,
  area,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "tel";
  hint?: string;
  area?: boolean;
  type?: string;
}) {
  const id = `rp-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {area ? (
        <textarea
          id={id}
          rows={3}
          className="field"
          required
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          className="field"
          required
          type={type}
          placeholder={placeholder}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint && <p className="mt-1.5 text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

function Pilihan({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  hint?: string;
}) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => {
          const aktif = value === o;
          return (
            <button
              type="button"
              key={o}
              onClick={() => onChange(o)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                aktif
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-sm"
                  : "border-[var(--line)] bg-[#fbfdff] text-[var(--ink)] hover:border-[var(--accent)]"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  aktif ? "border-white" : "border-[var(--muted)]"
                }`}
              >
                {aktif && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              {o}
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-1.5 text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}
