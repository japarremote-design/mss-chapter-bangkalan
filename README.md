# MSS Chapter Bangkalan

Sistem keanggotaan + presensi latihan berbasis QR. Next.js 15 (App Router) · Firestore · deploy di Vercel.

## Fitur

- **Calon anggota vs anggota** — pendaftar baru berstatus `calon`; status naik **otomatis** jadi `member` begitu kehadiran latihan pertamanya tercatat.
- **Sesi latihan dibuat admin** — judul, tanggal, jam, lokasi. Presensi bisa dibuka/ditutup kapan saja.
- **Presensi QR mode A (anggota yang scan)** — layar pengurus menampilkan QR yang **berganti tiap 20 detik** (ditandatangani HMAC), jadi screenshot lama tidak bisa dipakai titip absen. Anggota scan → cari nama → hadir.
- **Presensi QR mode B (pengurus yang scan)** — tiap anggota punya kartu QR sendiri (`/kartu/MSS-XXXXXX`, bisa dicetak). Pengurus buka scanner di HP dan memindai satu per satu. Ada juga input kode manual kalau kamera bermasalah.
- **Anti dobel** — satu orang hanya tercatat sekali per sesi (transaksi Firestore).
- Rekap hadir realtime + **unduh CSV** per sesi.
- Login hanya untuk pengurus (Firebase Auth email + password, dibatasi daftar email di env). Anggota tidak perlu punya akun.

## Struktur data Firestore

```
members/{id}
  code            "MSS-7F3K2Q"   // isi kartu QR, unik
  name, phone, address, note
  status          "calon" | "member"
  attendanceCount, firstAttendedAt, lastAttendedAt, createdAt

sessions/{id}
  title, date ("YYYY-MM-DD"), startTime, location
  open            boolean
  attendeeCount, createdAt, createdBy

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

Lalu **Redeploy**.

## Alur pemakaian saat latihan

**Mode A — anggota yang scan (default):**
1. Pengurus: `/admin/sesi` → buat sesi hari ini.
2. Buka detail sesi → layar menampilkan QR besar. Taruh di HP/laptop/proyektor di pintu masuk.
3. Anggota scan QR → cari nama → tekan → selesai. Yang belum terdaftar bisa langsung daftar di layar itu.

**Mode B — pengurus yang scan:**
1. Dari detail sesi tekan **Mode scan kartu**.
2. Nyalakan kamera, pindai kartu QR anggota satu per satu. Kalau kamera rewel, ketik kodenya manual.
3. Kartu QR anggota dicetak dari `/admin/anggota` → **Kartu QR** → Ctrl/Cmd + P.

Rekap: detail sesi → **Unduh CSV**.

## Halaman

| Rute | Untuk siapa |
|---|---|
| `/` | publik — beranda |
| `/daftar` | publik — pendaftaran calon anggota |
| `/a/[sesi]?t=…` | publik — presensi mandiri (hanya dari QR yang masih berlaku) |
| `/kartu/[kode]` | kartu QR anggota, siap cetak |
| `/admin/login` | pengurus |
| `/admin` | dasbor: jumlah anggota, calon, sesi |
| `/admin/sesi` | buat & buka/tutup sesi |
| `/admin/sesi/[id]` | layar QR + daftar hadir realtime + CSV |
| `/admin/sesi/[id]/scan` | scanner kartu anggota |
| `/admin/anggota` | kelola anggota & calon anggota |

## Catatan keamanan

- Token QR = HMAC-SHA256 dari `sessionId` + jendela waktu 20 detik, ditandatangani `SESSION_SECRET`. Server menerima 3 jendela terakhir (toleransi ~1 menit) supaya scan yang lambat tetap berhasil.
- Firestore ditutup untuk akses klien; semua baca/tulis lewat API route dengan Admin SDK.
- Endpoint admin memverifikasi ID token Firebase **dan** mencocokkan email dengan `ADMIN_EMAILS`.
- Presensi mandiri sengaja tidak memakai login — orang yang hadir fisik dan bisa memindai layar dianggap sah. Kalau nanti mau lebih ketat, tinggal tambahkan verifikasi nomor HP atau pakai mode B saja.
