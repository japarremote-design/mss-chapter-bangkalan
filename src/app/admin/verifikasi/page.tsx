"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdmin } from "@/components/useAdmin";
import { waLink } from "@/lib/config";
import type { Member, Verifikasi } from "@/lib/types";

export default function VerifikasiPage() {
  return (
    <AdminShell>
      <Verifikasi />
    </AdminShell>
  );
}

/**
 * Daftar periksa screening.
 *
 * Disusun dari pedoman kolam renang umum (CDC Healthy Swimming) dan daftar
 * kontraindikasi program renang adaptif. Ini alat bantu ingat untuk pengurus,
 * BUKAN diagnosis — kondisi berat tetap harus dipastikan ke dokter.
 */
const CEKLIS: { judul: string; warna: string; item: string[] }[] = [
  {
    judul: "Tunda dulu — kondisi sementara",
    warna: "amber",
    item: [
      "Sedang diare atau sakit perut",
      "Demam, muntah, atau sedang sakit menular",
      "Luka terbuka / bekas operasi yang belum kering",
      "Penyakit kulit menular (kurap, kudis, impetigo)",
      "Mata merah / belekan",
      "Infeksi telinga yang sedang kambuh",
    ],
  },
  {
    judul: "Perlu izin dokter dulu",
    warna: "red",
    item: [
      "Epilepsi atau pernah kejang",
      "Penyakit jantung",
      "Asma berat / sesak napas kambuhan",
      "Diabetes",
      "Tekanan darah tidak terkontrol",
      "Sedang hamil",
      "Baru operasi atau patah tulang belum pulih",
      "Vertigo / gangguan keseimbangan",
      "Alergi kaporit",
    ],
  },
  {
    judul: "Boleh ikut, tapi perlu pendampingan ekstra",
    warna: "blue",
    item: [
      "Sama sekali belum bisa berenang",
      "Punya trauma air",
      "Kondisi lain yang perlu diperhatikan relawan pelatih",
    ],
  },
];

const KELAS: Record<string, string> = {
  amber: "border-amber-300 bg-amber-50 text-amber-900",
  red: "border-red-300 bg-red-50 text-red-900",
  blue: "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--ink)]",
};

const LABEL: Record<Verifikasi, string> = {
  menunggu: "Menunggu verifikasi",
  disetujui: "Disetujui",
  ditunda: "Ditunda sementara",
  ditolak: "Tidak lolos",
};

/** Isian yang bukan "tidak ada" perlu dilihat pengurus. */
function perluPerhatian(v?: string) {
  const t = (v ?? "").trim().toLowerCase();
  return t !== "" && !["tidak ada", "tidak", "-", "nihil", "gak ada", "ga ada", "no"].includes(t);
}

function Verifikasi() {
  const { user, api } = useAdmin();
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState("");
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    if (!user) return;
    api<{ members: Member[] }>("/api/admin/members")
      .then((d) => setMembers(d.members))
      .catch((e) => setError(e.message))
      .finally(() => setMemuat(false));
  }, [user, api]);

  const menunggu = useMemo(
    () =>
      members
        .filter((m) => m.verifikasi === "menunggu")
        .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || "")),
    [members]
  );
  const tertahan = useMemo(
    () => members.filter((m) => m.verifikasi === "ditunda" || m.verifikasi === "ditolak"),
    [members]
  );

  function perbarui(m: Member) {
    setMembers((prev) => prev.map((x) => (x.id === m.id ? m : x)));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold">Verifikasi Calon Member</h1>
        <p className="text-xs text-[var(--muted)]">
          Pendaftar baru tidak bisa ngelist atau ikut latihan sebelum disetujui di halaman ini.
        </p>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 text-xs text-[var(--muted)]">
        <p className="mb-1 font-bold text-[var(--ink)]">Sebelum menyetujui</p>
        <p>
          Daftar periksa di tiap kartu disusun dari pedoman kolam renang umum. Itu alat bantu ingat,
          bukan pemeriksaan medis. Kalau ada kondisi yang berat atau meragukan, minta yang
          bersangkutan membawa keterangan dari dokter dulu — jangan diputuskan sendiri.
        </p>
      </div>

      {memuat ? (
        <p className="panel p-6 text-center text-sm text-[var(--muted)]">Memuat…</p>
      ) : menunggu.length === 0 ? (
        <p className="panel p-6 text-center text-sm text-[var(--muted)]">
          Tidak ada pendaftar yang menunggu verifikasi.
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-semibold">
            {menunggu.length} pendaftar menunggu diperiksa
          </p>
          {menunggu.map((m) => (
            <Kartu key={m.id} m={m} api={api} onSelesai={perbarui} onError={setError} />
          ))}
        </div>
      )}

      {tertahan.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Ditunda / tidak lolos ({tertahan.length})</h2>
          {tertahan.map((m) => (
            <Kartu key={m.id} m={m} api={api} onSelesai={perbarui} onError={setError} ringkas />
          ))}
        </div>
      )}
    </div>
  );
}

type ApiFn = ReturnType<typeof useAdmin>["api"];

function Kartu({
  m,
  api,
  onSelesai,
  onError,
  ringkas = false,
}: {
  m: Member;
  api: ApiFn;
  onSelesai: (m: Member) => void;
  onError: (s: string) => void;
  ringkas?: boolean;
}) {
  const [buka, setBuka] = useState(!ringkas);
  const [catatan, setCatatan] = useState(m.verifikasiCatatan ?? "");
  const [busy, setBusy] = useState(false);

  async function putuskan(verifikasi: Verifikasi) {
    setBusy(true);
    onError("");
    try {
      const d = await api<{ member: Member }>(`/api/admin/members/${m.id}/verifikasi`, {
        method: "PATCH",
        body: JSON.stringify({ verifikasi, catatan }),
      });
      onSelesai(d.member);
      setBuka(false);
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function tambahCatatan(teks: string) {
    setCatatan((c) => (c.includes(teks) ? c : [c.trim(), teks].filter(Boolean).join("; ")));
  }

  const pesanWa = waLink(
    m.phone ?? "",
    m.verifikasi === "disetujui"
      ? `Assalamualaikum ${m.name}, pendaftaranmu di MSS Chapter Bangkalan sudah kami verifikasi. Silakan ikut ngelist latihan lewat link jadwal di grup ya. Barakallah!`
      : `Assalamualaikum ${m.name}, terkait pendaftaranmu di MSS Chapter Bangkalan, kami ingin menanyakan beberapa hal dulu ya sebelum bisa ikut latihan.`
  );

  return (
    <div className="panel p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0">
          <p className="font-bold">{m.name}</p>
          <p className="text-xs text-[var(--muted)]">
            {m.code}
            {m.age ? ` · ${m.age} th` : ""}
            {m.address ? ` · ${m.address}` : ""}
          </p>
        </div>
        <span
          className={`badge ml-auto ${
            m.verifikasi === "menunggu" ? "badge-calon" : "badge-member"
          }`}
        >
          {LABEL[m.verifikasi]}
        </span>
        {ringkas && (
          <button onClick={() => setBuka(!buka)} className="btn btn-ghost px-3 py-1 text-xs">
            {buka ? "Tutup" : "Tinjau ulang"}
          </button>
        )}
      </div>

      {m.verifikasiCatatan && !buka && (
        <p className="mt-2 text-xs text-[var(--muted)]">Catatan: {m.verifikasiCatatan}</p>
      )}

      {buka && (
        <div className="mt-4 space-y-4">
          {/* Yang paling menentukan keputusan, ditaruh paling atas */}
          <div className="grid gap-2 sm:grid-cols-2">
            <Isian
              label="Riwayat penyakit"
              nilai={m.healthNotes}
              bahaya={perluPerhatian(m.healthNotes)}
            />
            <Isian
              label="Trauma air"
              nilai={m.waterTrauma}
              bahaya={perluPerhatian(m.waterTrauma)}
            />
            <Isian label="Sudah bisa berenang" nilai={m.canSwim} />
            <Isian label="Usia" nilai={m.age} />
            <Isian label="Pekerjaan" nilai={m.job} />
            <Isian label="No. WhatsApp" nilai={m.phone} />
            <Isian label="Kenal MSS dari" nilai={m.knowFrom} />
            <Isian label="Pelatih renang?" nilai={m.isSwimCoach} />
          </div>
          {m.reason && (
            <Isian label="Motivasi bergabung" nilai={m.reason} />
          )}

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
              Daftar periksa — klik untuk menambahkan ke catatan
            </p>
            {CEKLIS.map((g) => (
              <div key={g.judul} className={`rounded-xl border p-3 ${KELAS[g.warna]}`}>
                <p className="mb-2 text-xs font-bold">{g.judul}</p>
                <div className="flex flex-wrap gap-1.5">
                  {g.item.map((it) => (
                    <button
                      key={it}
                      type="button"
                      onClick={() => tambahCatatan(it)}
                      className="rounded-full border border-current/30 bg-white/70 px-2.5 py-1 text-xs hover:bg-white"
                    >
                      + {it}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="label">Catatan hasil screening</label>
            <textarea
              rows={2}
              className="field"
              placeholder="Wajib diisi kalau ditunda atau tidak lolos."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              disabled={busy}
              onClick={() => putuskan("disetujui")}
              className="btn btn-primary"
            >
              ✓ Setujui — boleh ikut latihan
            </button>
            <button disabled={busy} onClick={() => putuskan("ditunda")} className="btn btn-ghost">
              Tunda sementara
            </button>
            <button
              disabled={busy}
              onClick={() => putuskan("ditolak")}
              className="btn btn-ghost text-[var(--danger)]"
            >
              Tidak lolos
            </button>
            {m.phone && (
              <a
                href={pesanWa}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost ml-auto"
              >
                Hubungi via WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Isian({
  label,
  nilai,
  bahaya = false,
}: {
  label: string;
  nilai?: string;
  bahaya?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-2.5 ${
        bahaya ? "border-red-300 bg-red-50" : "border-[var(--line)]"
      }`}
    >
      <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className={`text-sm ${bahaya ? "font-semibold text-red-700" : ""}`}>
        {nilai?.trim() || "—"}
      </p>
    </div>
  );
}
