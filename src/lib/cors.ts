import "server-only";

/**
 * Endpoint publik dipanggil dari domain lain (Blogger), jadi perlu header CORS.
 * Batasi asal permintaan lewat env ALLOWED_ORIGINS (dipisah koma); kosong = izinkan semua.
 */
export function corsHeaders(req: Request): Record<string, string> {
  const allowed = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const origin = req.headers.get("origin") ?? "";
  const allowOrigin =
    allowed.length === 0 ? "*" : allowed.includes(origin) ? origin : allowed[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function withCors(req: Request, res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders(req))) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
}

export function preflight(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
