import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/** QR sesi berganti tiap 20 detik supaya tidak bisa "dititip" lewat screenshot. */
export const TOKEN_WINDOW_MS = 20_000;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET belum diisi di environment variables.");
  return s;
}

function sign(sessionId: string, window: number): string {
  return createHmac("sha256", secret())
    .update(`${sessionId}:${window}`)
    .digest("base64url")
    .slice(0, 16);
}

export function currentToken(sessionId: string, now = Date.now()): string {
  return sign(sessionId, Math.floor(now / TOKEN_WINDOW_MS));
}

/** Terima token window sekarang dan 2 window sebelumnya (toleransi ~1 menit). */
export function verifyToken(sessionId: string, token: string, now = Date.now()): boolean {
  if (!token) return false;
  const w = Math.floor(now / TOKEN_WINDOW_MS);
  for (const candidate of [sign(sessionId, w), sign(sessionId, w - 1), sign(sessionId, w - 2)]) {
    const a = Buffer.from(candidate);
    const b = Buffer.from(token);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

/**
 * Token permanen untuk link yang dibagikan ke grup WhatsApp (jadwal mingguan).
 * Tidak berganti waktu — supaya link yang sudah dishare tetap valid seminggu penuh —
 * tapi tetap ditandatangani agar orang luar tidak bisa menebak URL-nya.
 */
export function linkToken(id: string): string {
  return createHmac("sha256", secret()).update(`link:${id}`).digest("base64url").slice(0, 12);
}

export function verifyLinkToken(id: string, token: string): boolean {
  if (!token) return false;
  const a = Buffer.from(linkToken(id));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
