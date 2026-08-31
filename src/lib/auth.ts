import "server-only";
import { adminAuth } from "./firebaseAdmin";

export type AdminUser = { uid: string; email: string };

/**
 * Verifikasi Firebase ID token dari header Authorization: Bearer <token>.
 * Hanya email yang terdaftar di ADMIN_EMAILS yang boleh masuk.
 */
export async function requireAdmin(req: Request): Promise<AdminUser> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new HttpError(401, "Belum login.");

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(token);
  } catch {
    throw new HttpError(401, "Sesi login tidak valid atau sudah kedaluwarsa.");
  }

  const email = (decoded.email ?? "").toLowerCase();
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!allowed.includes(email)) {
    throw new HttpError(403, "Akun ini bukan admin.");
  }
  return { uid: decoded.uid, email };
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function errorResponse(err: unknown) {
  if (err instanceof HttpError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
  return Response.json({ error: message }, { status: 500 });
}
