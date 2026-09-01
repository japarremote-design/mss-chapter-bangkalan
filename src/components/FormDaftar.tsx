"use client";

import { useMemo, useState } from "react";
import { ADMIN_CONTACTS, waLink } from "@/lib/config";
import { useGrupWa } from "./useGrupWa";

type Sukses = { code: string; name: string; adminPhone: string };

const KOSONG = {
  name: "",
  nickname: "",
  age: "",
  gender: "",
  religion: "",
  address: "",
  job: "",
  maritalStatus: "",
  canSwim: "",
  waterTrauma: "",
  healthNotes: "",
  isSwimCoach: "",
  knowFrom: "",
  reason: "",
  phone: "",
  admin: ADMIN_CONTACTS[0]?.phone ?? "",
};

type Field = keyof typeof KOSONG;

const LANGKAH: { judul: string; sub: string; fields: Field[] }[] = [
  {
    judul: "Kenalan dulu",
    sub: "Data diri untuk administrasi keanggotaan.",
    fields: ["name", "nickname", "age", "gender", "religion", "maritalStatus", "address", "job"],
  },
  {
    judul: "Soal air",
    sub: "Supaya relawan pelatih tahu harus mendampingi seperti apa.",
    fields: ["canSwim", "waterTrauma", "healthNotes", "isSwimCoach"],
  },
  {
    judul: "Terakhir",
    sub: "Kontak dan alasanmu ingin bergabung.",
    fields: ["knowFrom", "reason", "phone", "admin"],
  },
];

export function FormDaftar() {
  const [form, setForm] = useState(KOSONG);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState<Sukses | null>(null);

  const set = (k: Field, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const usiaKurang = form.age.trim() !== "" && Number(form.age) > 0 && Number(form.age) < 15;

  const terisi = useMemo(
    () => LANGKAH[step].fields.every((f) => form[f].trim() !== "") && !usiaKurang,
    [form, step, usiaKurang]
  );

  const progres = useMemo(() => {
    const semua = LANGKAH.flatMap((l) => l.fields);
    return Math.round((semua.filter((f) => form[f].trim() !== "").length / semua.length) * 100);
  }, [form]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (step < LANGKAH.length - 1) {
      setStep((s) => s + 1);
      window.scrollTo({ top: document.getElementById("form-daftar")?.offsetTop ?? 0, behavior: "smooth" });
      return;
    }
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
      setSukses({ code: data.code, name: form.name, adminPhone: form.admin });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (sukses) return <Selesai sukses={sukses} />;

  const l = LANGKAH[step];

  return (
    <div id="form-daftar" className="panel overflow-hidden p-0">
      {/* Kepala: progres */}
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
                label="Usia"
                value={form.age}
                onChange={(v) => set("age", v)}
                inputMode="numeric"
                placeholder="mis. 24"
                hint="Minimal 15 tahun."
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
            <Teks
              label="Alamat domisili"
              value={form.address}
              onChange={(v) => set("address", v)}
              placeholder="Kecamatan / desa cukup"
            />
            <Teks label="Pekerjaan" value={form.job} onChange={(v) => set("job", v)} />
            {usiaKurang && (
              <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                Latihan MSS terbuka untuk usia 15 tahun ke atas. Hubungi admin kalau ingin
                menanyakan kemungkinan lain.
              </p>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <Pilihan
              label="Sudah bisa berenang?"
              value={form.canSwim}
              onChange={(v) => set("canSwim", v)}
              options={["Sudah", "Belum"]}
              hint="Belum bisa sama sekali juga tidak apa-apa — memang dilatih dari nol."
            />
            <Pilihan
              label="Punya trauma air?"
              value={form.waterTrauma}
              onChange={(v) => set("waterTrauma", v)}
              options={["Ya", "Tidak"]}
            />
            <Teks
              label="Riwayat penyakit"
              value={form.healthNotes}
              onChange={(v) => set("healthNotes", v)}
              placeholder="Tulis 'tidak ada' bila memang tidak ada"
              hint="Mis. asma, vertigo, epilepsi. Dipakai relawan pelatih untuk keamanan di kolam."
            />
            <Pilihan
              label="Apakah kamu seorang pelatih renang?"
              value={form.isSwimCoach}
              onChange={(v) => set("isSwimCoach", v)}
              options={["Ya", "Tidak"]}
              hint="Kalau ya, mungkin nanti diajak jadi relawan pelatih."
            />
          </>
        )}

        {step === 2 && (
          <>
            <Teks
              label="Kenal MSS melalui"
              value={form.knowFrom}
              onChange={(v) => set("knowFrom", v)}
              placeholder="mis. Instagram, teman, brosur"
            />
            <Teks
              label="Motivasi bergabung bersama MSS"
              value={form.reason}
              onChange={(v) => set("reason", v)}
              area
            />
            <Teks
              label="No. WhatsApp aktif"
              value={form.phone}
              onChange={(v) => set("phone", v)}
              inputMode="tel"
              placeholder="08123456xxxx"
              hint="Dipakai pengurus untuk konfirmasi dan info latihan."
            />
            <div>
              <label className="label" htmlFor="adm">
                Pilih admin koordinasi
              </label>
              <select
                id="adm"
                className="field"
                value={form.admin}
                onChange={(e) => set("admin", e.target.value)}
              >
                {ADMIN_CONTACTS.map((a) => (
                  <option key={a.phone} value={a.phone}>
                    Admin {a.name} ({a.role})
                  </option>
                ))}
              </select>
            </div>
            <p className="rounded-xl bg-[var(--accent-soft)] p-3 text-xs text-[var(--muted)]">
              Data ini hanya dipakai pengurus MSS untuk koordinasi latihan dan keamanan di kolam,
              tidak dibagikan ke pihak lain.
            </p>
          </>
        )}

        <div className="flex items-center gap-3 border-t border-[var(--line)] pt-4">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn btn-ghost"
            >
              ← Kembali
            </button>
          )}
          <button disabled={busy || !terisi} className="btn btn-primary ml-auto px-6">
            {busy
              ? "Mengirim…"
              : step < LANGKAH.length - 1
                ? "Lanjut →"
                : "Kirim pendaftaran"}
          </button>
        </div>

        {!terisi && (
          <p className="text-center text-xs text-[var(--muted)]">
            Lengkapi semua isian di langkah ini untuk melanjutkan.
          </p>
        )}
      </form>
    </div>
  );
}

function Selesai({ sukses }: { sukses: Sukses }) {
  const grup = useGrupWa();
  const pesan = `Assalamualaikum Admin, saya sudah mengisi form pendaftaran di website atas nama ${sukses.name} (kode ${sukses.code}). Mohon konfirmasinya ya, syukron!`;
  return (
    <div className="panel overflow-hidden p-0">
      <div className="bg-gradient-to-br from-[#0f6fb0] to-[#12468f] px-6 py-8 text-center text-white">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-3xl">
          ✓
        </div>
        <h3 className="text-xl font-bold">Barakallah, pendaftaranmu tersimpan!</h3>
        <p className="mt-1 text-sm opacity-90">Selamat datang di skuad, {sukses.name}.</p>
      </div>

      <div className="p-5">
        <div className="rounded-xl border border-dashed border-[var(--accent)] bg-[var(--accent-soft)] p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-[var(--muted)]">Kode member-mu</p>
          <p className="mt-1 font-mono text-2xl font-black tracking-widest text-[var(--accent)]">
            {sukses.code}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Tunjukkan ke relawan pelatih saat latihan pertama.
          </p>
        </div>

        <p className="mt-5 mb-2 text-sm font-semibold">Dua langkah terakhir:</p>
        <div className="space-y-2">
          {grup.calon && (
            <a
              href={grup.calon}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full"
            >
              1. Gabung Grup WhatsApp Calon Member
            </a>
          )}
          <a
            href={waLink(sukses.adminPhone, pesan)}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn w-full ${grup.calon ? "btn-ghost" : "btn-primary"}`}
          >
            {grup.calon ? "2. " : ""}Konfirmasi ke WhatsApp admin
          </a>
        </div>

        <p className="mt-4 text-xs text-[var(--muted)]">
          Jadwal latihan tiap pekan dibagikan di grup calon member — dari situ kamu ngelist mau ikut
          sesi yang mana. Statusmu naik jadi <b>member</b> setelah hadir di latihan pertama.
        </p>
      </div>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "tel";
  hint?: string;
  area?: boolean;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
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
