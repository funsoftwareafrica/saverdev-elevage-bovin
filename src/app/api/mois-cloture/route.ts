// API MoisCloture — verrouillage des mois comptables (Task 31-B).
//
// GET   : liste tous les mois clôturés/ouverts
// POST  : clôture un mois (marque cloture=true, cloturePar, dateCloture)
// DELETE: déclôture un mois (marque cloture=false)
//
// La clôture/déclôture est réservée au rôle E2A (administrateur).
// Tant qu'un mois est clôturé, la route POST /api/saisie refuse les saisies
// dont la date tombe dans ce mois (HTTP 403 "Mois clôturé, saisie impossible").

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit";

/** Valide le format "YYYY-MM". */
function isValidMonthFormat(s: string | null | undefined): s is string {
  if (!s) return false;
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

export async function GET() {
  try {
    const mois = await db.moisCloture.findMany({
      orderBy: { mois: "desc" },
    });
    return NextResponse.json({ mois });
  } catch (e) {
    console.error("GET /api/mois-cloture:", e);
    return NextResponse.json(
      { error: "Erreur serveur", details: (e as Error).message },
      { status: 500 }
    );
  }
}

async function postHandler(req: NextRequest) {
  // Réservé E2A (administrateur).
  const { session, forbidden } = await requireRole(["E2A"]);
  if (forbidden || !session?.user) {
    return NextResponse.json(
      { error: "Accès refusé — rôle E2A requis" },
      { status: 403 }
    );
  }
  let body: { mois?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const mois = body.mois;
  if (!isValidMonthFormat(mois)) {
    return NextResponse.json(
      { error: "Format mois invalide (attendu YYYY-MM)" },
      { status: 400 }
    );
  }
  try {
    const existing = await db.moisCloture.findUnique({ where: { mois } });
    if (existing) {
      const updated = await db.moisCloture.update({
        where: { mois },
        data: {
          cloture: true,
          cloturePar: session.user.email,
          dateCloture: new Date(),
        },
      });
      return NextResponse.json({ ok: true, mois: updated });
    }
    const created = await db.moisCloture.create({
      data: {
        mois,
        cloture: true,
        cloturePar: session.user.email,
        dateCloture: new Date(),
      },
    });
    return NextResponse.json({ ok: true, mois: created }, { status: 201 });
  } catch (e) {
    console.error("POST /api/mois-cloture:", e);
    return NextResponse.json(
      { error: "Erreur serveur", details: (e as Error).message },
      { status: 500 }
    );
  }
}

async function deleteHandler(req: NextRequest) {
  // Réservé E2A (administrateur).
  const { session, forbidden } = await requireRole(["E2A"]);
  if (forbidden || !session?.user) {
    return NextResponse.json(
      { error: "Accès refusé — rôle E2A requis" },
      { status: 403 }
    );
  }
  const url = new URL(req.url);
  const mois = url.searchParams.get("mois");
  if (!isValidMonthFormat(mois)) {
    return NextResponse.json(
      { error: "Paramètre `mois` requis (format YYYY-MM)" },
      { status: 400 }
    );
  }
  try {
    const existing = await db.moisCloture.findUnique({ where: { mois } });
    if (!existing) {
      return NextResponse.json({ ok: true, mois: null, message: "Aucune entrée à déclôturer" });
    }
    const updated = await db.moisCloture.update({
      where: { mois },
      data: {
        cloture: false,
        cloturePar: session.user.email,
        dateCloture: new Date(),
      },
    });
    return NextResponse.json({ ok: true, mois: updated });
  } catch (e) {
    console.error("DELETE /api/mois-cloture:", e);
    return NextResponse.json(
      { error: "Erreur serveur", details: (e as Error).message },
      { status: 500 }
    );
  }
}

// Rate-limited à 30 req/min par IP (moins critique que /api/saisie, mais
// on garde un garde-fou pour éviter les abus).
export const POST = withRateLimit(postHandler, { maxPerMinute: 30 });
export const DELETE = withRateLimit(deleteHandler, { maxPerMinute: 30 });
