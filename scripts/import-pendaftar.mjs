/**
 * Migrasi sheet "Pendaftar" (Google Sheets) ke Firestore.
 *
 * Cara pakai:
 *   1. Buka Google Sheet → sheet "Pendaftar" → File → Download → CSV.
 *   2. Taruh file itu di folder proyek, mis. pendaftar.csv
 *   3. Pastikan .env.local sudah terisi kredensial Firebase Admin.
 *   4. node scripts/import-pendaftar.mjs pendaftar.csv
 *      Tambahkan --dry untuk sekadar melihat hasil parsing tanpa menulis ke database.
 *
 * Kolom yang dikenali (urutan bebas, header harus ada):
 *   Timestamp | Nama Lengkap | No WhatsApp | Pekerjaan | Alasan Bergabung
 *
 * Aman dijalankan ulang: nomor WhatsApp yang sudah ada di Firestore dilewati.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { cert, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// ── Muat .env.local secara sederhana ──────────────────────────────────────────
try {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
} catch {
  console.log("Catatan: .env.local tidak ditemukan, memakai environment yang ada.");
}

const [, , filePath, ...flags] = process.argv;
const DRY = flags.includes("--dry");

if (!filePath) {
  console.error("Pakai: node scripts/import-pendaftar.mjs <file.csv> [--dry]");
  process.exit(1);
}

// ── Parser CSV kecil (mendukung kutip ganda dan koma di dalam sel) ────────────
function parseCsv(text) {
  const rows = [];
  let row = [];
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
    else if (c === ",") {
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

function pick(obj, ...names) {
  for (const n of names) {
    const key = Object.keys(obj).find((k) => k.toLowerCase().trim() === n.toLowerCase());
    if (key && String(obj[key]).trim()) return String(obj[key]).trim();
  }
  return "";
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateCode() {
  let out = "";
  for (let i = 0; i < 6; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `MSS-${out}`;
}

// ── Jalan ─────────────────────────────────────────────────────────────────────
const raw = readFileSync(filePath, "utf8").replace(/^﻿/, "");
const rows = parseCsv(raw);
const headers = rows[0].map((h) => h.trim());
const records = rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));

console.log(`Terbaca ${records.length} baris dari ${filePath}.`);

if (!process.env.FIREBASE_PROJECT_ID && !DRY) {
  console.error("Kredensial Firebase belum lengkap. Isi .env.local lebih dulu.");
  process.exit(1);
}

const db = DRY
  ? null
  : getFirestore(
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      })
    );

let masuk = 0;
let dilewati = 0;
const kodeTerpakai = new Set();

for (const rec of records) {
  const name = pick(rec, "Nama Lengkap", "Nama", "name");
  const phone = pick(rec, "No WhatsApp", "No. WhatsApp", "Whatsapp", "phone");
  const job = pick(rec, "Pekerjaan", "Pekerjaan / Aktivitas", "job");
  const reason = pick(rec, "Alasan Bergabung", "Alasan", "reason");
  const ts = pick(rec, "Timestamp", "Waktu");

  if (!name) {
    dilewati++;
    continue;
  }

  let createdAt = new Date().toISOString();
  const parsed = ts ? new Date(ts) : null;
  if (parsed && !Number.isNaN(parsed.getTime())) createdAt = parsed.toISOString();

  if (DRY) {
    console.log(`  • ${name} — ${phone || "(tanpa WA)"} — ${job || "-"}`);
    masuk++;
    continue;
  }

  if (phone) {
    const dup = await db.collection("members").where("phone", "==", phone).limit(1).get();
    if (!dup.empty) {
      console.log(`  – lewati (sudah ada): ${name} / ${phone}`);
      dilewati++;
      continue;
    }
  }

  let code = generateCode();
  while (kodeTerpakai.has(code) || !(await db.collection("members").where("code", "==", code).limit(1).get()).empty) {
    code = generateCode();
  }
  kodeTerpakai.add(code);

  await db.collection("members").add({
    code,
    name,
    phone,
    address: "",
    job,
    reason,
    note: "",
    status: "calon",
    attendanceCount: 0,
    firstAttendedAt: null,
    lastAttendedAt: null,
    createdAt,
    source: "import-sheet",
  });

  console.log(`  ✓ ${name} → ${code}`);
  masuk++;
}

console.log(
  DRY
    ? `\nMode uji: ${masuk} baris siap diimpor, ${dilewati} dilewati. Jalankan tanpa --dry untuk menulis ke database.`
    : `\nSelesai. ${masuk} member masuk, ${dilewati} dilewati.`
);
process.exit(0);
