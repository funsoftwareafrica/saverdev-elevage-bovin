// Rate limiter simple en mémoire (Map) — sans Redis.
// Limitations : reset par processus (en dev Next.js multi-process c'est faux,
// mais en dev standalone c'est OK). Pour la prod Vercel serverless, ce limiter
// s'applique par instance — utiliser Upstash ou un service dédié pour une
// limite globale stricte. Suffit pour bloquer les attaques basiques.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

type RateEntry = { count: number; resetAt: number };
const ipRequestCounts = new Map<string, RateEntry>();

// Ménage périodique pour éviter une fuite mémoire sur les IPs qui ne reviennent pas.
// Toutes les 5 minutes, on purge les entrées expirées.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipRequestCounts) {
      if (entry.resetAt < now) ipRequestCounts.delete(ip);
    }
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * Vérifie si l'IP a le droit de faire une nouvelle requête dans la fenêtre.
 * Compte les requêtes par IP sur une fenêtre glissante de 60s.
 *
 * @param ip        IP du client (extraite via getClientIp)
 * @param maxPerMinute Nombre max de requêtes autorisées par minute
 */
export function rateLimit(ip: string, maxPerMinute = 10): RateLimitResult {
  const now = Date.now();
  const entry = ipRequestCounts.get(ip);

  if (!entry || entry.resetAt < now) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return {
      ok: true,
      remaining: maxPerMinute - 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
      limit: maxPerMinute,
    };
  }

  if (entry.count >= maxPerMinute) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt, limit: maxPerMinute };
  }

  entry.count++;
  return {
    ok: true,
    remaining: maxPerMinute - entry.count,
    resetAt: entry.resetAt,
    limit: maxPerMinute,
  };
}

/**
 * Extrait l'IP client depuis les headers de la requête.
 * Prend en compte X-Forwarded-For (proxy/gateway Caddy) et x-real-ip.
 * Fallback sur une constante "unknown" si rien n'est trouvé.
 */
export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    // X-Forwarded-For peut contenir une liste "client, proxy1, proxy2"
    // On prend la première IP = celle du client d'origine.
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();
  // req.ip est dispo en Next.js mais typé comme string | undefined
  const reqIp = (req as unknown as { ip?: string }).ip;
  if (reqIp) return reqIp;
  return "unknown";
}

/**
 * Wrapper HOF pour appliquer un rate limiting sur un route handler Next.js.
 * Renvoie une 429 Too Many Requests si la limite est dépassée, avec les
 * headers standards :
 *   - X-RateLimit-Limit
 *   - X-RateLimit-Remaining
 *   - X-RateLimit-Reset (timestamp Unix en secondes)
 *   - Retry-After (secondes avant retry)
 *
 * @example
 * export const POST = withRateLimit(async (req) => { ... }, { maxPerMinute: 5 });
 *
 * @example (clé custom, e.g. par utilisateur authentifié)
 * export const POST = withRateLimit(handler, {
 *   maxPerMinute: 30,
 *   keyFn: (req) => req.headers.get("x-user-id") ?? getClientIp(req),
 * });
 */
export function withRateLimit<TArgs extends unknown[]>(
  handler: (req: NextRequest, ...args: TArgs) => Promise<Response> | Response,
  options: {
    maxPerMinute?: number;
    keyFn?: (req: NextRequest) => string | Promise<string>;
  } = {}
) {
  const { maxPerMinute = 10, keyFn } = options;
  return async (req: NextRequest, ...args: TArgs): Promise<Response> => {
    const keyRaw = keyFn ? await keyFn(req) : getClientIp(req);
    const ip = keyRaw || "unknown";
    const result = rateLimit(ip, maxPerMinute);

    if (!result.ok) {
      const retryAfterSec = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        {
          ok: false,
          error: "Trop de requêtes. Réessayez plus tard.",
          retryAfter: retryAfterSec,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(result.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
            "Retry-After": String(retryAfterSec),
          },
        }
      );
    }

    const response = await handler(req, ...args);
    // Ajoute les headers de quota sur la réponse (utile pour debug côté client)
    if (response instanceof Response) {
      try {
        response.headers.set("X-RateLimit-Limit", String(result.limit));
        response.headers.set("X-RateLimit-Remaining", String(result.remaining));
        response.headers.set("X-RateLimit-Reset", String(Math.floor(result.resetAt / 1000)));
      } catch {
        // Ignore si les headers sont immuables
      }
    }
    return response;
  };
}
