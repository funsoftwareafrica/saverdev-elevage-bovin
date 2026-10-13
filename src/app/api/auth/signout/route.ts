// POST /api/auth/signout
// Déconnexion : efface le cookie de session NextAuth côté serveur.
//
// Pourquoi cette route existe :
//   - NextAuth v4 fournit déjà POST /api/auth/signout mais elle exige un
//     csrfToken (anti-CSRF) obtenu via GET /api/auth/csrf — incompatible
//     avec un logout en un clic depuis le bouton "Se déconnecter" de la
//     sidebar SAVERDEV (qui est juste un onClick sans formulaire HTML).
//   - Cette route custom efface directement le cookie session-token et
//     applique un rate limit de 5 req/min par IP pour éviter qu'un attaquant
//     ne purge les sessions par flooding.
//
// Comportement :
//   - 200 { ok: true } si le cookie est effacé (même si l'utilisateur n'était
//     pas connecté — on ne fuite pas l'état de session)
//   - 429 si le rate limit est dépassé
//
// Côté client (cf. app-sidebar.tsx) :
//   await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
//   useAppStore.logout(); // vide l'état Zustand local (UI)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";

function sessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

async function signoutHandler(_req: NextRequest): Promise<Response> {
  const cookieName = sessionCookieName();
  const isProd = process.env.NODE_ENV === "production";

  // On pose le cookie avec Max-Age=0 → le navigateur le supprime immédiatement.
  // On pose aussi le callbackUrl pour rediriger vers "/" mais le client gère
  // lui-même la navigation (useAppStore.logout() remet isAuthenticated=false).
  const cookieParts = [
    `${cookieName}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (isProd) cookieParts.push("Secure");

  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.headers.set("Set-Cookie", cookieParts.join("; "));
  return response;
}

// Rate limit : 5 requêtes / minute / IP (anti-flood).
export const POST = withRateLimit(signoutHandler, { maxPerMinute: 5 });
