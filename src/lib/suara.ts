"use client";

/**
 * Notifikasi suara untuk layar relawan pelatih — supaya dia dengar
 * konfirmasi presensi tanpa harus lihat layar terus (tangan sering basah
 * di pinggir kolam). Bunyinya ikut volume media HP; browser tidak bisa
 * memaksa lebih keras dari pengaturan volume perangkat.
 *
 * Browser mobile sering memblokir audio yang tidak dipicu langsung dari
 * ketukan pengguna (autoplay policy) — termasuk hasil pindaian kamera yang
 * datang lewat callback async. Panggil bukaAudio() sekali dari tombol yang
 * jelas-jelas ditekan user (mis. "Nyalakan kamera") untuk "membuka" audio
 * lebih dulu, supaya notifikasi berikutnya dari hasil scan tetap bisa bunyi.
 */

let dibuka = false;

export function bukaAudio() {
  if (dibuka || typeof window === "undefined") return;
  dibuka = true;
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis?.speak(u);
  } catch {}
}

function beep(frekuensi = 880, durasiMs = 160) {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = frekuensi;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durasiMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durasiMs / 1000 + 0.03);
    osc.onended = () => ctx.close().catch(() => {});
  } catch {}
}

function ucapkan(teks: string) {
  try {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(teks);
    u.lang = "id-ID";
    u.rate = 1;
    u.volume = 1;
    const suaraId = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith("id"));
    if (suaraId) u.voice = suaraId;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

/** Presensi baru berhasil dicatat. */
export function notifPresensiSukses(nama: string) {
  beep(880, 150);
  ucapkan(`Presensi MSS Chapter Bangkalan sukses, atas nama ${nama}.`);
}

/** Sudah tercatat hadir sebelumnya — bukan error, tapi tetap perlu didengar. */
export function notifSudahHadir(nama: string) {
  beep(660, 120);
  ucapkan(`${nama} sudah tercatat hadir sebelumnya.`);
}

/** Ditolak (belum ngelist, di luar jam, dsb.) — nada rendah, tanpa suara teks
 * karena pesan errornya bermacam-macam dan sebaiknya dibaca langsung. */
export function notifGagal() {
  beep(220, 220);
}
