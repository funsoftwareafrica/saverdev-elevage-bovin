// GET  /api/soins — liste des soins (carnet de santé)
// POST /api/soins — enregistre un soin + génère automatiquement la prochaine
//                    échéance (prochainRappel) selon le type de soin.
//
// Types de soins prédéfinis et leurs intervalles de rappel (calendrier vaccinal) :
//   - Vaccin FMD           → 6 mois
//   - Vaccin PPB           → 12 mois
//   - Antiparasitaire      → 3 mois
//   - Vermifuge            → 3 mois
//   - Vaccin charbon       → 12 mois
//   - Autre / Contrôle     → pas de rappel (null)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Intervalle en mois pour la prochaine échéance selon le type de soin. */
function rappelIntervalMonths(type: string): number | null {
  const t = (type ?? "").toLowerCase();
  if (t.includes("fmd")) return 6;
  if (t.includes("ppb")) return 12;
  if (t.includes("antiparas") || t.includes("antiparasitaire")) return 3;
  if (t.includes("vermifuge") || t.includes("vermif")) return 3;
  if (t.includes("charbon")) return 12;
  if (t.includes("vaccin")) return 6; // vaccin générique → 6 mois par défaut
  return null; // "Contrôle" / "Traitement" / "Autre" → pas de rappel
}

/** Types de soins prédéfinis proposés dans le formulaire. */
export const SOIN_TYPES = [
  "Vaccin FMD",
  "Vaccin PPB",
  "Vaccin charbon",
  "Antiparasitaire",
  "Vermifuge",
  "Traitement",
  "Contrôle",
  "Autre",
];

/** Calcule la date du prochain rappel (date soin + intervalle en mois). */
function computeNextRappel(dateSoin: Date, type: string): Date | null {
  const months = rappelIntervalMonths(type);
  if (!months) return null;
  const next = new Date(dateSoin);
  next.setMonth(next.getMonth() + months);
  return next;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const bovinId = url.searchParams.get("bovinId");
  const soins = await db.soin.findMany({
    where: bovinId ? { bovinId } : undefined,
    orderBy: { date: "desc" },
  });

  // Récupère les identifiants bovins pour enrichir la réponse
  const bovinIds = Array.from(new Set(soins.map((s) => s.bovinId)));
  const bovins = await db.bovin.findMany({
    where: { id: { in: bovinIds } },
    select: { id: true, identifiant: true, espece: true },
  });
  const bovinMap = new Map(bovins.map((b) => [b.id, b]));

  return NextResponse.json(
    soins.map((s) => {
      const b = bovinMap.get(s.bovinId);
      return {
        id: s.id,
        bovinId: s.bovinId,
        date: s.date.toISOString(),
        type: s.type,
        libelle: s.libelle,
        cout: s.cout,
        prochainRappel: s.prochainRappel?.toISOString() ?? null,
        notes: s.notes,
        bovinIdentifiant: b?.identifiant ?? "—",
        bovinEspece: b?.espece ?? "BOVIN",
      };
    })
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const dateSoin = body.date ? new Date(body.date) : new Date();
  if (isNaN(dateSoin.getTime())) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  // Calcule le prochain rappel si non fourni explicitement
  let prochainRappel: Date | null = null;
  if (body.prochainRappel) {
    prochainRappel = new Date(body.prochainRappel);
    if (isNaN(prochainRappel.getTime())) prochainRappel = null;
  } else {
    prochainRappel = computeNextRappel(dateSoin, body.type);
  }

  const soin = await db.soin.create({
    data: {
      bovinId: body.bovinId,
      date: dateSoin,
      type: body.type ?? "Contrôle",
      libelle: body.libelle,
      cout: Number(body.cout ?? 0),
      prochainRappel,
      notes: body.notes ?? null,
    },
  });

  // Historique
  await db.historique.create({
    data: {
      action: "SOIN",
      entiteType: "Bovin",
      entiteId: body.bovinId,
      details: `${body.type ?? "Contrôle"} — ${body.libelle} (${body.cout ?? 0} FCFA)${prochainRappel ? ` · prochain rappel ${prochainRappel.toLocaleDateString("fr-FR")}` : ""}`,
    },
  });

  return NextResponse.json({
    id: soin.id,
    bovinId: soin.bovinId,
    date: soin.date.toISOString(),
    type: soin.type,
    libelle: soin.libelle,
    cout: soin.cout,
    prochainRappel: soin.prochainRappel?.toISOString() ?? null,
    notes: soin.notes,
  }, { status: 201 });
}
