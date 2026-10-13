import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 — la convention "middleware" est dépréciée en faveur de "proxy".
// Le fichier doit être nommé `proxy.ts` (à la racine de `src/` ou du projet).
// La fonction exportée peut s'appeler `proxy` ou `middleware` (alias acceptés).

// Liste blanche des origines autorisées à appeler les APIs SAVERDEV.
// En local : ports 3000 (dev) et 3030 (mini-service WS).
// En prod : domaine Vercel + alias automatiques.
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3030",
  "https://saverdev.vercel.app",
  "https://saverdev-funsoftwareafricas-projects.vercel.app",
];

function getAllowedOrigin(reqOrigin: string | null): string | null {
  if (!reqOrigin) return null;
  if (ALLOWED_ORIGINS.includes(reqOrigin)) return reqOrigin;
  // Accepte les previews Vercel (*.vercel.app) en prod
  if (process.env.NODE_ENV === "production" && reqOrigin.endsWith(".vercel.app")) {
    return reqOrigin;
  }
  return null;
}

export function proxy(request: NextRequest) {
  const reqOrigin = request.headers.get("origin");
  const allowedOrigin = getAllowedOrigin(reqOrigin);

  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (allowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    response.headers.set("Access-Control-Max-Age", "86400");
    // Sécurité : headers de défense complémentaires
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return response;
  }

  const response = NextResponse.next();
  if (allowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  }
  // Headers de sécurité appliqués à toutes les réponses
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  // CSP : autorise les scripts same-origin + hugeicons + recharts inline styles
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' ws: wss:; frame-ancestors 'none';"
  );
  return response;
}

export const config = { matcher: ["/api/:path*"] };
