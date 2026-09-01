# MSS Chapter Bangkalan

Situs komunitas + sistem keanggotaan & presensi latihan berbasis QR. Next.js 15 (App Router) · Firestore · deploy di Vercel.

Situs publik lama (Apps Script + Blogger) sudah digabung ke sini: hero, keunggulan, media sosial, jadwal latihan, dan formulir pendaftaran dengan redirect WhatsApp admin.

## Alur mingguan

1. **Senin — relawan pelatih buat jadwal.** Di `/admin/sesi`, isi beberapa baris sekaligus (tanggal, jam, kolam, kuota opsional) lalu simpan. Sistem membuat satu paket jadwal berisi semua sesi minggu itu.
2. **Share ke grup WhatsApp.** Tekan **Share ke WhatsApp** — pesan otomatis tersusun berisi daftar sesi + satu link. Bisa juga **Salin link**.
3. **Dua grup WhatsApp.** Link yang sama dishare ke grup calon member dan grup member. Di daftar relawan pelatih, tiap nama diberi label CALON / MEMBER lengkap dengan hitungannya.
4. **Calon member ngelist.** Buka link → cari namanya (atau isi nama + WA kalau belum terdaftar) → pilih sesi mana saja yang mau diikuti. Bisa batal ikut selama belum hadir. Pilihan "siapa saya" tersimpan di HP-nya, jadi minggu depan tinggal pilih sesi.
5. **Hari-H — presensi.** Relawan pelatih membuka **link relawan pelatih** untuk sesi itu di HP-nya (tanpa akun) untuk menampilkan QR atau memindai kartu; peserta scan. **Hanya yang sudah ngelist yang bisa presensi**; yang belum ngelist ditolak dengan pesan jelas. Relawan pelatih tetap bisa menimpa lewat tombol "Tetap catat hadir" di mode scan kartu.
6. **Rekap.** Detail sesi menampilkan siapa yang hadir dan siapa yang ngelist tapi tidak datang. CSV berisi kedua kolom itu.

## Fitur

- **Calon member vs member** — pendaftar baru berstatus `calon`; status naik **otomatis** jadi `member` begitu kehadiran latihan pertamanya tercatat.
- **Jadwal mingguan sekali buat** — beberapa sesi dalam satu form, menghasilkan satu link share untuk grup WhatsApp.
- **Daftar ikut (RSVP)** — peserta memilih sesi lewat link. Kuota per sesi opsional; kalau penuh, tombol ikut otomatis mati.
- **Presensi wajib ngelist dulu** — yang tidak ada di daftar ditolak saat scan, dengan opsi timpa manual untuk relawan pelatih.
- **Presensi QR mode A (member yang scan)** — layar pengurus menampilkan QR yang **berganti tiap 20 detik** (ditandatangani HMAC), jadi screenshot lama tidak bisa dipakai titip absen. Member scan → cari nama → hadir.
- **Presensi QR mode B (pengurus yang scan)** — tiap member punya kartu QR sendiri (`/kartu/MSS-XXXXXX`, bisa dicetak). Pengurus buka scanner di HP dan memindai satu per satu. Ada juga input kode manual kalau kamera bermasalah.
- **Anti dobel** — satu orang hanya tercatat sekali per sesi (transaksi Firestore).
- Rekap hadir realtime + **unduh CSV** per sesi.
- **Jadwal latihan** dikelola pengurus di `/admin/jadwal`, tampil di beranda, dan tersedia sebagai API publik untuk situs Blogger.
- **Formulir pendaftaran calon member** — 15 isian sesuai formulir MSS (nama lengkap & panggilan, usia, jenis kelamin, agama, alamat, pekerjaan, status pernikahan, sudah bisa berenang, trauma air, riwayat penyakit, pelatih renang atau bukan, kenal MSS dari mana, motivasi, no WA, pilih admin). Google Form tidak lagi diperlukan.
- Login hanya untuk pengurus (Firebase Auth email + password, dibatasi daftar email di env). Member tidak perlu punya akun.

## Relawan pelatih: cukup link, bukan akun

Relawan pelatih **tidak perlu akun**. Untuk tiap sesi, admin mendapat satu **link relawan pelatih** di halaman detail sesi (`Salin link relawan pelatih` / `Kirim lewat WhatsApp`).

Dari link itu relawan pelatih bisa:

- menampilkan QR presensi (berganti tiap 20 detik),
- memindai kartu QR member lewat kamera HP, atau input kode manual,
- melihat siapa yang sudah hadir dan siapa yang ngelist tapi belum datang,
- menimpa aturan "harus ngelist" lewat tombol **Tetap catat hadir**.

Yang **tidak** bisa dilakukan dari link itu: melihat atau mengubah data member lain, membuat/menghapus sesi, mengubah jadwal. Link-nya ditandatangani (HMAC dari `SESSION_SECRET`) dan hanya berlaku untuk satu sesi — kalau bocor, yang bisa dibuka orang hanyalah layar sesi tersebut. Untuk mematikannya, tutup presensi sesi itu dari `/admin/sesi`.

## Dua relawan pelatih di slot yang sama

Kalau tanggal, jam, dan kolamnya **sama persis**, sistem menganggapnya **satu latihan dengan beberapa relawan pelatih**: sesi tidak diduplikasi, nama relawan pelatih baru ditambahkan ke sesi yang sudah ada, dan admin diberi tahu bahwa slotnya digabung. Peserta ngelist sekali, presensi masuk ke satu daftar, dan kedua relawan pelatih memakai link yang sama.

Kalau memang ingin dua kelompok terpisah di jam yang sama, bedakan salah satu kolomnya — misalnya tulis kolam sebagai "Kolam Syariah (kelompok A)" dan "Kolam Syariah (kelompok B)".

## Data pendaftaran

Formulir di `/daftar` (dan di bagian bawah beranda) menggantikan Google Form. Isian, urutan, dan status wajibnya dibuat sama dengan formulir lama.

Di `/admin/member`, klik nama siapa pun untuk membuka seluruh jawabannya. **Riwayat penyakit** ditandai merah kalau isinya bukan "tidak ada" — supaya relawan pelatih cepat melihat siapa yang perlu perhatian khusus di kolam. Yang menjawab "Ya" pada pertanyaan pelatih renang diberi badge **PELATIH**, jadi calon relawan pelatih mudah ditemukan. Tombol **Unduh CSV** mengekspor daftar yang sedang tampil (ikut filter dan pencarian).

Formulir ini menampung data yang cukup pribadi — agama, riwayat penyakit, alamat, usia. Beberapa hal yang sebaiknya dijaga:

- Akun admin hanya untuk pengurus inti; relawan pelatih cukup pakai link relawan pelatih, yang memang tidak bisa membuka data member.
- File CSV yang sudah diunduh ada di HP/laptop pengurus dan tidak lagi dilindungi aplikasi — hapus kalau sudah tidak dipakai, jangan disebar di grup.
- Kalau ada member minta datanya dihapus, hapus lewat `/admin/member`.

## Sambungan ke formulir MSS Pusat

Member baru wajib mengisi formulir Google milik MSS Pusat. Supaya tidak mengisi dua kali, app menyiapkan formulir itu **sudah terisi** — member tinggal memeriksa lalu menekan Kirim.

Alurnya:

1. Pengurus membuka `/admin/pusat`, menempelkan **tautan isian otomatis** (pre-filled link) dari formulir pusat, lalu memasangkan tiap pertanyaan dengan isian di app.
2. Begitu seorang calon member hadir di latihan perdananya dan naik status, di layar presensinya muncul kotak **Lapor ke MSS Pusat**. Data yang belum ada (tempat & tanggal lahir, kecamatan, kabupaten, provinsi) ditanyakan di situ — sekali saja, tersimpan untuk seterusnya.
3. Tombolnya membuka formulir pusat dengan seluruh jawaban terisi.

Kalau kehadirannya dicatat lewat scan kartu (member tidak memegang layar), pengurus bisa mengirim tautannya lewat tombol **Link pusat** di `/admin/member`. Member yang belum membuka pendataan pusat ditandai badge **BELUM LAPOR**.

### Kalau formulir pusat berubah

Tidak ada ID pertanyaan yang ditanam di kode. Ambil tautan isian otomatis yang baru, tempel lagi di `/admin/pusat`, lalu simpan — pertanyaan yang ID-nya tidak berubah tetap memakai pemetaan lama, yang baru tinggal dipasangkan.

Cara mengambil tautannya: buka formulir pusat dalam mode edit → menu titik tiga → **Dapatkan tautan isian otomatis** → isi tiap pertanyaan dengan contoh yang mudah dikenali (mis. ketik `NAMA` di Nama Lengkap) → **Dapatkan tautan** → **Salin tautan**.

> Catatan: app **tidak** mengirim jawaban diam-diam ke pusat. Member sendiri yang menekan Kirim, jadi kalau pusat mengubah formulirnya, paling buruk ada kolom yang kosong — bukan data yang hilang tanpa ketahuan.

## Pesan jadwal ke grup

Tombol **Share ke WhatsApp** / **Salin teks pesan** di `/admin/sesi` menyusun pesan mengikuti gaya grup MSS:

```
Assalamu'alaikum, semangat pagi bunda2 semua☀

Berikut Rencana jadwal latihan bersama (Latbar) utk pekan I bulan September 2026, In syaa Allah.
…

Relawan Pelatih: Andri + Maria
Hari/Tanggal : Jumat, 4 September 2026
Jam      : *07.00 WIB - 08.30 WIB*
Tempat : Kolam *Safira*
HTM     : 10000 + Infaq Terbaik
Kuota   : 15 orang (sisa 12)

…

Isi list lewat link ini ya bunda (tidak perlu ketik nama di grup):
https://…/ikut/xxx?k=xxx

*Note* :
Perlengkapan yang Wajib Di Bawa…
```

Bedanya dengan pesan manual: nomor 1–15 yang harus diketik member digantikan **satu link**. Sisa slot dihitung otomatis, jadi tidak ada lagi nama yang ketimpa ("ketik Otw dulu" tidak diperlukan lagi) dan tidak ada yang mendaftar melebihi kuota.

Pembuka pesan, catatan penutup, dan HTM default diatur di `/admin/pengaturan`. Tulis `{JADWAL}` di pembuka untuk menyisipkan judul paket jadwal.

Di halaman ngelist, tiap sesi menampilkan relawan pelatih, jam, kolam, HTM, sisa slot, dan **daftar nama yang sudah ikut** — sama seperti kebiasaan list di grup, tinggal ketuk "Lihat daftar nama".

## Dua grup WhatsApp

Alurnya begini:

- Orang mendaftar lewat formulir di beranda → layar sukses menampilkan tombol **Gabung Grup WhatsApp Calon Member**, baru kemudian tombol konfirmasi ke admin.
- Dari grup itulah calon member menerima link jadwal mingguan dan ngelist ikut latihan.
- Begitu kehadiran latihan pertamanya tercatat, layar presensinya menampilkan ucapan selamat + tombol **Gabung Grup WhatsApp Member**.

Link undangan grup diatur pengurus sendiri di **`/admin/pengaturan`** — tempel tautan dari WhatsApp (*Info grup → Undang lewat tautan → Salin tautan*), simpan, selesai. Halaman publik langsung ikut berubah, **tanpa deploy ulang**.

Kalau salah satu dikosongkan, tombolnya otomatis tidak muncul — tidak ada link rusak. Env `NEXT_PUBLIC_WA_GROUP_CALON` / `NEXT_PUBLIC_WA_GROUP_MEMBER` masih dibaca sebagai cadangan kalau pengaturan belum pernah diisi, tapi tidak wajib lagi.

## Branding

Palet diambil dari logo MSS (biru laut `#0f6fb0`, biru tua `#12468f`, biru gelombang `#34a7dd`), didefinisikan sebagai CSS variable di `src/app/globals.css` — ubah di satu tempat, semua halaman ikut.

Logo dipakai di tiga tempat sekaligus:

- `public/logo.png` — tampil di beranda, header admin, layar QR, kartu member
- `src/app/icon.png` — favicon tab browser
- `src/app/apple-icon.png` — ikon saat disimpan ke home screen HP

File yang kamu kirim beresolusi 150×150. Kalau ada versi yang lebih besar (mis. 512×512), timpa saja ketiga file itu — tidak ada kode yang perlu diubah, dan hasil cetak kartu akan lebih tajam.

## Menyambungkan situs Blogger

Endpoint publik sudah ber-CORS dan formatnya sengaja **dibuat sama persis dengan Apps Script lama**, jadi kode Blogger yang ada cukup diubah URL-nya.

| Endpoint | Ganti apa di Blogger |
|---|---|
| `GET  https://<domain>/api/public/jadwal` | pengganti `...exec?action=getJadwal` |
| `POST https://<domain>/api/public/daftar` | pengganti `POST ...exec` |

Di `<script>` Blogger, ganti bagian ini:

```js
// LAMA
var BLOGGER_WEB_APP_URL = "https://script.google.com/macros/s/AKfycb.../exec";
fetch(BLOGGER_WEB_APP_URL + "?action=getJadwal")
fetch(BLOGGER_WEB_APP_URL, { method: "POST", body: JSON.stringify(formData) })

// BARU
var API_BASE = "https://mss-chapter-bangkalan.vercel.app";
fetch(API_BASE + "/api/public/jadwal")
fetch(API_BASE + "/api/public/daftar", { method: "POST", body: JSON.stringify(formData) })
```

Respons jadwal tetap `[{ "Hari": ..., "Jam": ..., "Lokasi Kolam": ..., "Status": ... }]`, dan endpoint daftar tetap menerima `{nama, whatsapp, pekerjaan, alasan}` serta membalas `{success, message}` — jadi fungsi `renderTabelJadwal()` dan `selesaikanPendaftaran()` yang sudah ada tidak perlu disentuh.

Kalau ingin membatasi siapa yang boleh memanggil API, isi env `ALLOWED_ORIGINS` dengan domain Blogger-mu (dipisah koma). Dikosongkan = terbuka untuk semua.

## Migrasi data dari Google Sheet

```bash
# 1. Di Google Sheet: sheet "Pendaftar" → File → Download → CSV
# 2. Taruh filenya di folder proyek, lalu:
node scripts/import-pendaftar.mjs pendaftar.csv --dry   # lihat dulu hasil bacanya
node scripts/import-pendaftar.mjs pendaftar.csv         # tulis ke Firestore
```

Semua pendaftar masuk sebagai **calon member** dengan kode kartu QR otomatis. Script aman dijalankan berulang — nomor WhatsApp yang sudah ada akan dilewati.

## Struktur data Firestore

```
schedules/{id}
  day, time, pool     // "Sabtu", "07.00 - 09.00", "Kolam Syariah Bangkalan"
  status              "Tersedia" | "Penuh"
  order               urutan tampil

members/{id}
  code            "MSS-7F3K2Q"   // isi kartu QR, unik
  name, nickname, phone, age, gender, religion, address, job
  maritalStatus, canSwim, waterTrauma, healthNotes, isSwimCoach
  knowFrom, reason, note
  birthPlace, birthDate, district, city, province   // untuk formulir MSS Pusat
  pusatOpenedAt

config/umum
  waGroupCalon, waGroupMember    // link undangan grup WhatsApp
  pesanPembuka, pesanCatatan     // template pesan jadwal
  htmDefault

config/pusat
  formUrl         // alamat formulir Google MSS Pusat
  entries[]       // { entryId, type, sample, field } hasil pemetaan admin
  status          "calon" | "member"
  attendanceCount, firstAttendedAt, lastAttendedAt, createdAt

weeks/{id}
  label, startDate, endDate    // paket jadwal mingguan
  open, sessionCount, createdAt, createdBy

sessions/{id}
  title, date ("YYYY-MM-DD"), startTime, location
  coaches         // array nama relawan pelatih, mis. ["Andri", "Maria"]
  fee             // HTM, mis. "10000 + Infaq Terbaik" 
  weekId          // milik paket mingguan yang mana
  quota           // 0 = tanpa batas
  open            boolean
  attendeeCount, rsvpCount, createdAt, createdBy

sessions/{id}/rsvp/{memberId}
  memberId, code, name, at, attended

sessions/{id}/attendance/{memberId}
  memberId, code, name, status, method ("mandiri"|"scan-kartu"), at
```

## Setup

### 1. Firebase

1. Buat project di [console.firebase.google.com](https://console.firebase.google.com).
2. **Build → Firestore Database → Create database** (mode production, region `asia-southeast2` / Jakarta).
3. **Build → Authentication → Sign-in method → Email/Password → Enable.**
4. Di tab **Users**, tambahkan akun pengurus manual (email + password). Tidak ada halaman registrasi admin — ini disengaja.
5. **Project settings → General → Your apps → Web app (</>)** → salin `apiKey`, `authDomain`, `projectId`, `appId`.
6. **Project settings → Service accounts → Generate new private key** → file JSON berisi `project_id`, `client_email`, `private_key`.
7. **Firestore → Rules** → tempel isi `firestore.rules` lalu Publish (semua akses lewat server).

### 2. Jalankan lokal

```bash
npm install
cp .env.example .env.local   # lalu isi semua nilainya
npm run dev
```

Buka http://localhost:3000 · admin di http://localhost:3000/admin

> `SESSION_SECRET` buat dengan `openssl rand -base64 32`.
> Kamera QR hanya jalan di `localhost` atau HTTPS — jadi mode scan baru bisa dites penuh setelah deploy.

### 3. Deploy ke Vercel

```bash
npm i -g vercel
vercel          # ikuti prompt, pilih framework Next.js (terdeteksi otomatis)
vercel --prod
```

Atau push ke GitHub lalu **Import Project** di [vercel.com/new](https://vercel.com/new).

Setelah itu **Project → Settings → Environment Variables**, isi semua variabel dari `.env.example` untuk environment *Production* (dan *Preview* kalau perlu):

| Variabel | Catatan |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | dari konfigurasi Web app |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` | dari JSON service account |
| `FIREBASE_PRIVATE_KEY` | tempel apa adanya, termasuk `\n`, dibungkus tanda kutip |
| `SESSION_SECRET` | hasil `openssl rand -base64 32` |
| `ADMIN_EMAILS` | email pengurus, dipisah koma |
| `PUBLIC_REGISTRATION` | `on` / `off` |
| `NEXT_PUBLIC_WA_GROUP_CALON` | opsional — cadangan, sekarang diatur di `/admin/pengaturan` |
| `NEXT_PUBLIC_WA_GROUP_MEMBER` | opsional — cadangan, sekarang diatur di `/admin/pengaturan` |
| `ALLOWED_ORIGINS` | domain yang boleh memanggil API publik; kosong = semua |

Lalu **Redeploy**.

## Alur pemakaian saat latihan

**Mode A — member yang scan (default):**
1. Pengurus: `/admin/sesi` → buka sesi hari itu → **Layar QR**.
2. Taruh layarnya di HP/laptop/tablet di pintu masuk kolam.
3. Peserta scan QR → cari nama (hanya nama yang sudah ngelist yang muncul) → tekan → selesai.

**Mode B — pengurus yang scan:**
1. Dari detail sesi tekan **Mode scan kartu**.
2. Nyalakan kamera, pindai kartu QR member satu per satu. Kalau kamera rewel, ketik kodenya manual.
3. Kartu QR member dicetak dari `/admin/member` → **Kartu QR** → Ctrl/Cmd + P.

Rekap: detail sesi → **Unduh CSV**.

## Halaman

| Rute | Untuk siapa |
|---|---|
| `/` | publik — beranda lengkap: profil, sosmed, jadwal, formulir daftar |
| `/daftar` | publik — pendaftaran calon member |
| `/ikut/[minggu]?k=…` | publik — link yang dishare ke grup WA untuk ngelist ikut latihan |
| `/relawan/[sesi]?k=…` | relawan pelatih — layar QR + scanner, tanpa akun |
| `/a/[sesi]?t=…` | publik — presensi mandiri (hanya dari QR yang masih berlaku) |
| `/kartu/[kode]` | kartu QR member, siap cetak |
| `/admin/login` | pengurus |
| `/admin` | dasbor: jumlah member, calon, sesi |
| `/admin/sesi` | buat & buka/tutup sesi |
| `/admin/sesi/[id]` | layar QR + daftar hadir realtime + CSV |
| `/admin/sesi/[id]/scan` | scanner kartu member |
| `/admin/member` | kelola member & calon member |
| `/admin/sesi` | buat jadwal mingguan, salin/share link grup, pantau jumlah yang ngelist |
| `/admin/jadwal` | jadwal rutin yang tampil di beranda & API Blogger (berbeda dari sesi) |
| `/admin/pusat` | pemetaan isian app ke formulir Google MSS Pusat |
| `/admin/pengaturan` | link undangan grup WhatsApp calon member & member |
| `/pusat/[member]?k=…` | member — lengkapi data lalu buka formulir pusat yang sudah terisi |
| `/api/public/jadwal` | JSON jadwal untuk situs luar (CORS aktif) |

## Preview saat di-share (Open Graph)

Tag Open Graph & Twitter Card sudah terpasang di `src/app/layout.tsx`, dengan gambar preview `public/og.png` (1200×630). Saat link ditempel di WhatsApp, Telegram, Facebook, X, atau LinkedIn, muncul kartu berisi logo, nama, dan tagline.

Satu env yang perlu diisi supaya URL gambarnya absolut dan benar:

```
NEXT_PUBLIC_SITE_URL=https://bangkalan-mss.vercel.app
```

Ganti kalau nanti pindah ke domain sendiri, lalu redeploy.

Mau ganti gambar previewnya? Timpa `public/og.png` dengan gambar 1200×630 (di bawah 300 KB supaya WhatsApp mau menampilkannya).

Setelah deploy, cache preview di tiap platform perlu di-refresh sekali:

| Platform | Cara refresh |
|---|---|
| Facebook / Instagram | [Sharing Debugger](https://developers.facebook.com/tools/debug/) → tempel URL → **Scrape Again** |
| X (Twitter) | [Card Validator](https://cards-dev.twitter.com/validator) |
| LinkedIn | [Post Inspector](https://www.linkedin.com/post-inspector/) |
| WhatsApp / Telegram | cache kedaluwarsa sendiri; untuk paksa refresh, kirim URL dengan `?v=2` di belakangnya |

Halaman admin, presensi, dan kartu member diberi `noindex` — hanya beranda dan `/daftar` yang masuk mesin pencari (`robots.txt` dan `sitemap.xml` dibuat otomatis).

## Kredit

Footer memuat "Powered by [Qfaz Digital](https://qfazdigital.my.id)" — teksnya ada di `src/app/page.tsx` bagian `Footer()`.

Kontak admin, tautan media sosial, dan poin keunggulan diatur di satu file: `src/lib/config.ts`.

## Catatan keamanan

- Token QR = HMAC-SHA256 dari `sessionId` + jendela waktu 20 detik, ditandatangani `SESSION_SECRET`. Server menerima 3 jendela terakhir (toleransi ~1 menit) supaya scan yang lambat tetap berhasil.
- Firestore ditutup untuk akses klien; semua baca/tulis lewat API route dengan Admin SDK.
- Endpoint admin memverifikasi ID token Firebase **dan** mencocokkan email dengan `ADMIN_EMAILS`.
- Presensi mandiri sengaja tidak memakai login — orang yang hadir fisik dan bisa memindai layar dianggap sah. Kalau nanti mau lebih ketat, tinggal tambahkan verifikasi nomor HP atau pakai mode B saja.
