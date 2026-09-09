/**
 * Jendela waktu presensi.
 *
 * Sebelumnya QR bisa dipakai kapan saja selama sesinya dibuka — termasuk
 * berhari-hari sebelum latihan. Di sini dihitung rentang waktu yang wajar
 * untuk satu sesi, memakai zona WIB (UTC+7).
 */

const WIB_OFFSET_JAM = 7;

/** Boleh presensi sekian menit sebelum jam mulai (untuk yang datang awal). */
export const TOLERANSI_AWAL_MENIT = 60;
/** Dan sekian menit setelah jam selesai (untuk yang absen setelah renang). */
export const TOLERANSI_AKHIR_MENIT = 120;

const HARI = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** Waktu WIB (tanggal + jam menit) sebagai Date absolut. */
function wib(dateISO: string, jam: number, menit: number): Date | null {
  const m = dateISO.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(
    Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), jam - WIB_OFFSET_JAM, menit)
  );
}

/**
 * Ambil jam mulai & selesai dari teks bebas seperti
 * "07.00 - 09.00", "07:00-08.30 WIB", atau "07.00".
 */
export function bacaJam(teks: string): { mulai: [number, number]; selesai: [number, number] } | null {
  const cocok = [...String(teks ?? "").matchAll(/(\d{1,2})[.:](\d{2})/g)].map(
    (x) => [Number(x[1]), Number(x[2])] as [number, number]
  );
  const sah = cocok.filter(([j, n]) => j >= 0 && j <= 23 && n >= 0 && n <= 59);
  if (sah.length === 0) return null;
  return { mulai: sah[0], selesai: sah.length > 1 ? sah[sah.length - 1] : sah[0] };
}

export type Jendela = { buka: Date; tutup: Date };

/**
 * Rentang waktu presensi satu sesi.
 * Kalau jamnya tidak terbaca, dipakai sepanjang hari itu (WIB).
 */
export function jendelaPresensi(date: string, startTime: string): Jendela | null {
  const awalHari = wib(date, 0, 0);
  const akhirHari = wib(date, 23, 59);
  if (!awalHari || !akhirHari) return null;

  const jam = bacaJam(startTime);
  if (!jam) return { buka: awalHari, tutup: akhirHari };

  const mulai = wib(date, jam.mulai[0], jam.mulai[1]);
  let selesai = wib(date, jam.selesai[0], jam.selesai[1]);
  if (!mulai || !selesai) return { buka: awalHari, tutup: akhirHari };

  // "21.00 - 01.00" → jam selesai jatuh di hari berikutnya.
  if (selesai.getTime() <= mulai.getTime()) {
    selesai = new Date(selesai.getTime() + 24 * 60 * 60_000);
  }

  return {
    buka: new Date(mulai.getTime() - TOLERANSI_AWAL_MENIT * 60_000),
    tutup: new Date(selesai.getTime() + TOLERANSI_AKHIR_MENIT * 60_000),
  };
}

/** "Sabtu, 5 September" — untuk pesan ke peserta. */
export function tanggalIndonesia(date: string): string {
  const d = wib(date, 12, 0);
  if (!d) return date;
  const wibDate = new Date(d.getTime() + WIB_OFFSET_JAM * 60 * 60_000);
  return `${HARI[wibDate.getUTCDay()]}, ${wibDate.getUTCDate()} ${BULAN[wibDate.getUTCMonth()]}`;
}

/** "06.00" dalam WIB. */
export function jamIndonesia(d: Date): string {
  const w = new Date(d.getTime() + WIB_OFFSET_JAM * 60 * 60_000);
  return `${String(w.getUTCHours()).padStart(2, "0")}.${String(w.getUTCMinutes()).padStart(2, "0")}`;
}

export type CekWaktu =
  | { boleh: true }
  | { boleh: false; alasan: "belum" | "lewat"; pesan: string };

/** Apakah sekarang masih di dalam jendela presensi sesi ini? */
export function cekWaktuPresensi(
  date: string,
  startTime: string,
  sekarang: Date = new Date()
): CekWaktu {
  const j = jendelaPresensi(date, startTime);
  if (!j) return { boleh: true }; // tanggal tidak terbaca — jangan menghalangi

  if (sekarang.getTime() < j.buka.getTime()) {
    return {
      boleh: false,
      alasan: "belum",
      pesan: `Presensi sesi ini baru dibuka ${tanggalIndonesia(date)} pukul ${jamIndonesia(
        j.buka
      )} WIB.`,
    };
  }

  if (sekarang.getTime() > j.tutup.getTime()) {
    return {
      boleh: false,
      alasan: "lewat",
      pesan: `Waktu presensi sesi ${tanggalIndonesia(date)} sudah lewat (ditutup pukul ${jamIndonesia(
        j.tutup
      )} WIB). Hubungi relawan pelatih kalau kehadiranmu belum tercatat.`,
    };
  }

  return { boleh: true };
}
