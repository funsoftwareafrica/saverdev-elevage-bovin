// POST /api/auth/credentials-login
// Route d'authentification personnalisée — pont entre le formulaire de login
// SAVERDEV (login-view.tsx) et NextAuth.
//
// Pourquoi cette route existe :
//   - Le formulaire de login SAVERDEV est rendu en overlay sur / (contrainte
//     "une seule route" du cahier des charges). Il ne peut pas appeler
//     signIn("credentials") directement côté client sans intégrer le hook
//     useSession et le SessionProvider (qui complexifie l'UX).
//   - Historiquement, login-view.tsx appelait useAppStore.login() (Zustand)
//     qui créait une session "factice" sans token JWT → getServerSession
//     retournait null côté API → toutes les routes requireRole renvoyaient 403.
//   - Cette route résout le disconnect : elle reçoit {email, password},
//     vérifie via bcrypt.compare, et si OK, génère un token JWT NextAuth
//     (compatible avec getServerSession) qu'elle pose en cookie.
//
// Token JWT :
//   - Signé et chiffré avec NEXTAUTH_SECRET via next-auth/jwt encode()
//   - Le salt = nom du cookie ("next-auth.session-token" en dev,
//     "__Secure-next-auth.session-token" en prod) — ce qui correspond au
//     format attendu par NextAuth pour le décodage côté getServerSession.
//   - maxAge = 30 jours (aligné avec authOptions.session.maxAge)
//
// Cookie :
//   - httpOnly, sameSite=Lax, path=/ (default NextAuth v4)
//   - secure=true uniquement en production (HTTPS)
//
// Rate limiting : 5 tentatives/min par IP (cf. withRateLimit helper)
// — bloquerait le bruteforce d'un mot de passe faible.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { db } from "@/lib/db";
import { withRateLimit } from "@/lib/rate-limit";
import type { Role } from "@/lib/types";

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 jours (cf. lib/auth.ts)

// Nom du cookie de session NextAuth v4 :
//   - "next-auth.session-token" en dev (HTTP)
//   - "__Secure-next-auth.session-token" en prod (HTTPS)
function sessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

async function loginHandler(req: NextRequest): Promise<Response> {
  // Extraction du body JSON — on gère les erreurs de parsing proprement
  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Requête JSON invalide" },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Email et mot de passe requis" },
      { status: 400 }
    );
  }

  // Validation basique du format email — on ne déclenche pas un Zod complet
  // pour ne pas alourdir cette route (l'email est validé par la regex
  // suivante, et le password est comparé via bcrypt en temps constant).
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Email invalide" },
      { status: 400 }
    );
  }

  // Recherche de l'utilisateur en DB — on utilise findUnique pour profiter
  // de l'index unique sur email. On ne fuite pas l'existence du compte
  // (réponse identique en cas d'email inconnu ou de mauvais mot de passe).
  const user = await db.user.findUnique({ where: { email } }).catch(() => null);

  let passwordOk = false;
  if (user) {
    // bcrypt.compare gère les erreurs et renvoie false en cas de hash invalide
    try {
      passwordOk = await bcrypt.compare(password, user.password);
    } catch {
      passwordOk = false;
    }
  }

  if (!user || !passwordOk) {
    return NextResponse.json(
      { ok: false, error: "Identifiants invalides" },
      { status: 401 }
    );
  }

  // Génère un token JWT NextAuth (JWE chiffré) — il sera lu côté serveur par
  // getServerSession(authOptions) sur toutes les routes /api/* qui utilisent
  // requireRole().
  //
  // IMPORTANT sur le salt : NextAuth v4 appelle jwt.decode() en interne SANS
  // passer le paramètre `salt` (cf. node_modules/next-auth/core/routes/
  // session.js:48-50 et core/lib/callback-handler.js:52-54). Le salt par
  // défaut dans next-auth/jwt encode/decode est donc la chaîne vide "".
  // On doit donc passer `salt: ""` (ou ne rien passer) à encode() pour que
  // la clé dérivée HKDF soit identique à celle utilisée côté décodage.
  // Si on passait `salt: cookieName` (comme on pourrait le croire vu que
  // c'est le nom du cookie), la clé dérivée serait différente et le décodage
  // échouerait avec JWEDecryptionFailed (cf. observation initiale du bug).
  const cookieName = sessionCookieName();
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error(
      "[credentials-login] NEXTAUTH_SECRET manquant — impossible de signer le JWT"
    );
    return NextResponse.json(
      { ok: false, error: "Configuration serveur invalide" },
      { status: 500 }
    );
  }

  const token = await encode({
    token: {
      // Champs NextAuth standards
      sub: user.id,
      email: user.email,
      name: user.name,
      // Champs personnalisés (cf. callbacks jwt/session dans lib/auth.ts)
      id: user.id,
      role: user.role as Role,
    },
    secret,
    // salt: "" → aligné sur le comportement de jwt.decode côté NextAuth
    // (qui ne passe pas de salt non plus). Le nom du cookie sert de clé
    // d'extraction côté `getServerSession`, pas de salt HKDF.
    salt: "",
    maxAge: SESSION_MAX_AGE,
  });

  // Pose le cookie — attention, Next.js Route Handlers ne gèrent pas les
  // cookies via un cookie-store automatique, on doit le faire manuellement
  // via le header Set-Cookie.
  const isProd = process.env.NODE_ENV === "production";
  const cookieParts = [
    `${cookieName}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE}`,
  ];
  if (isProd) cookieParts.push("Secure");

  const publicUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  };

  const response = NextResponse.json(
    { ok: true, user: publicUser },
    { status: 200 }
  );
  response.headers.set("Set-Cookie", cookieParts.join("; "));
  return response;
}

// Wrapper avec rate limiting : 5 tentatives de login / minute / IP.
// Au-delà : 429 Too Many Requests avec Retry-After.
// On utilise l'IP seule (sans combiner avec l'email) car :
//   1. La consigne dit explicitement "max 5 tentatives/min par IP"
//   2. Lire le body dans le keyFn pour le combiner avec l'email
//      risquerait de consommer le stream avant le handler effectif
//   3. Un attaquant qui change d'email mais garde la même IP reste bloqué
//      (ce qui est le comportement attendu pour ralentir le bruteforce)
export const POST = withRateLimit(loginHandler, { maxPerMinute: 5 });
