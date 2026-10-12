// GET /api/soins/a-venir — liste les soins à venir dans les 30 prochains jours
//
// Règles :
//   - Ne renvoie que les soins dont le `prochainRappel` est dans le futur
//     (entre maintenant et maintenant + 30 jours).
//   - Les soins en retard (prochainRappel dans le passé) sont également inclus
//     dans une clé `enRetard` pour permettre l'affichage d'une alerte.
//   - Triés par proximité chronologique (le plus proche d'abord).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const now = new Date();
  const dans30j = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const soins = await db.soin.findMany({
    where: { prochainRappel: { not: null } },
    orderBy: { prochainRappel: "asc" },
  });

  const bovinIds = Array.from(new Set(soins.map((s) => s.bovinId)));
  const bovins = await db.bovin.findMany({
    where: { id: { in: bovinIds } },
    select: { id: true, identifiant: true, espece: true, statut: true },
  });
  const bovinMap = new Map(bovins.map((b) => [b.id, b]));

  const mapSoin = (s: typeof soins[number]) => {
    const b = bovinMap.get(s.bovinId);
    const dRappel = s.prochainRappel ? new Date(s.prochainRappel) : null;
    const isLate = dRappel ? dRappel.getTime() < now.getTime() : false;
    return {
      id: s.id,
      bovinId: s.bovinId,
      bovinIdentifiant: b?.identifiant ?? "—",
      bovinEspece: b?.espece ?? "BOVIN",
      bovinStatut: b?.statut ?? "EN_ENGRAISSEMENT",
      date: s.date.toISOString(),
      type: s.type,
      libelle: s.libelle,
      cout: s.cout,
      prochainRappel: s.prochainRappel?.toISOString() ?? null,
      notes: s.notes,
      isLate,
      joursAvantEcheance: dRappel
        ? Math.ceil((dRappel.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        : null,
    };
  };

  const aVenir = soins
    .filter((s) => {
      const d = s.prochainRappel ? new Date(s.prochainRappel).getTime() : null;
      return d !== null && d >= now.getTime() && d <= dans30j.getTime();
    })
    .map(mapSoin);

  const enRetard = soins
    .filter((s) => {
      const d = s.prochainRappel ? new Date(s.prochainRappel).getTime() : null;
      return d !== null && d < now.getTime();
    })
    .map(mapSoin);

  return NextResponse.json({
    aVenir,
    enRetard,
    total: aVenir.length + enRetard.length,
  });
}
