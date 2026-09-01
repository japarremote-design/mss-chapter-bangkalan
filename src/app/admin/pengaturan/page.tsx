"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdmin } from "@/components/useAdmin";

export default function PengaturanPage() {
  return (
    <AdminShell>
      <Pengaturan />
    </AdminShell>
  );
}

type Settings = {
  waGroupCalon: string;
  waGroupMember: string;
  pesanPembuka: string;
  pesanCatatan: string;
  htmDefault: string;
};

function Pengaturan() {
  const { user, api } = useAdmin();
  const [form, setForm] = useState<Settings>({
    waGroupCalon: "",
    waGroupMember: "",
    pesanPembuka: "",
    pesanCatatan: "",
    htmDefault: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (!user) return;
    api<{ settings: Settings }>("/api/admin/pengaturan")
      .then((d) => setForm(d.settings))
      .catch((e) => setError(e.message));
  }, [user, api]);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const d = await api<{ settings: Settings }>("/api/admin/pengaturan", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(d.settings);
      setInfo("Tersimpan. Tombol gabung grup di halaman publik langsung ikut berubah.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold">Pengaturan</h1>
        <p className="text-xs text-[var(--muted)]">
          Link undangan grup WhatsApp. Bisa diganti kapan saja tanpa deploy ulang.
        </p>
      </div>

      <div className="panel p-4 text-sm">
        <p className="font-semibold">Cara mengambil link undangan grup</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[var(--muted)]">
          <li>Buka grupnya di WhatsApp → ketuk nama grup di atas.</li>
          <li>
            Pilih <b>Undang lewat tautan</b> → <b>Salin tautan</b>.
          </li>
          <li>Tempel di kolom di bawah, lalu simpan.</li>
        </ol>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Kalau link grup direset di WhatsApp, tautan lama langsung mati — cukup salin yang baru dan
          simpan lagi di sini.
        </p>
      </div>

      <form onSubmit={simpan} className="panel space-y-4 p-4">
        <div>
          <label className="label" htmlFor="calon">
            Grup calon member
          </label>
          <input
            id="calon"
            className="field"
            placeholder="https://chat.whatsapp.com/…"
            value={form.waGroupCalon}
            onChange={(e) => setForm({ ...form, waGroupCalon: e.target.value })}
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Ditawarkan tepat setelah seseorang selesai mendaftar sebagai calon member.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="member">
            Grup member
          </label>
          <input
            id="member"
            className="field"
            placeholder="https://chat.whatsapp.com/…"
            value={form.waGroupMember}
            onChange={(e) => setForm({ ...form, waGroupMember: e.target.value })}
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Ditawarkan begitu seseorang naik status jadi member setelah latihan perdananya.
          </p>
        </div>

        <div className="border-t border-[var(--line)] pt-4">
          <p className="mb-3 font-semibold">Pesan jadwal ke grup</p>

          <div className="mb-4">
            <label className="label" htmlFor="htm">
              HTM default
            </label>
            <input
              id="htm"
              className="field"
              placeholder="10000 + Infaq Terbaik"
              value={form.htmDefault}
              onChange={(e) => setForm({ ...form, htmDefault: e.target.value })}
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Terisi otomatis saat membuat sesi baru; tetap bisa diubah per sesi.
            </p>
          </div>

          <div className="mb-4">
            <label className="label" htmlFor="pembuka">
              Pembuka pesan
            </label>
            <textarea
              id="pembuka"
              rows={6}
              className="field font-mono text-xs"
              value={form.pesanPembuka}
              onChange={(e) => setForm({ ...form, pesanPembuka: e.target.value })}
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Tulis <code>{"{JADWAL}"}</code> di tempat yang ingin diisi judul paket jadwal, mis.
              &quot;pekan I bulan September 2026&quot;.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="catatan">
              Catatan penutup
            </label>
            <textarea
              id="catatan"
              rows={8}
              className="field font-mono text-xs"
              value={form.pesanCatatan}
              onChange={(e) => setForm({ ...form, pesanCatatan: e.target.value })}
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Perlengkapan wajib, aturan info H-2, dan pesan lain yang selalu ikut di bawah jadwal.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {info && (
          <p className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
            {info}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button disabled={busy} className="btn btn-primary">
            {busy ? "Menyimpan…" : "Simpan"}
          </button>
          <span className="text-xs text-[var(--muted)]">
            Kolom yang dikosongkan = tombol gabung grup disembunyikan.
          </span>
        </div>
      </form>
    </div>
  );
}
