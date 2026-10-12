// GET /api/bovins — liste de tous les bovins/ovins
// POST /api/bovins — création d'un nouvel animal (achat)
//   body.espece ("BOVIN" | "OVIN") → génère l'identifiant BOE-XXX ou OVN-XXX
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toBovin } from "@/lib/server-mappers";
import { nextAnimalIdentifiant } from "@/lib/format";
import type { Espece } from "@/lib/format";

export async function GET() {
  const bovins = await db.bovin.findMany({ orderBy: { identifiant: "asc" } });
  return NextResponse.json(bovins.map(toBovin));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Espèce : BOVIN (défaut) ou OVIN — détermine le préfixe de l'identifiant.
  const espece: Espece = body.espece === "OVIN" ? "OVIN" : "BOVIN";

  // Compteur d'identifiants déjà émis pour cette espèce (BOE-XXX ou OVN-XXX).
  // On ne scanne que les identifiants de la même espèce pour éviter les
  // collisions entre BOE-001..BOE-010 et OVN-001..OVN-005 par exemple.
  const existing = await db.bovin.findMany({
    where: { espece },
    select: { identifiant: true },
  });
  const identifiant = nextAnimalIdentifiant(espece, existing);

  const bovin = await db.bovin.create({
    data: {
      identifiant,
      espece,
      race: body.race ?? (espece === "OVIN" ? "Mouton Sokoto" : "Zébu"),
      sexe: body.sexe ?? "Mâle",
      dateAchat: new Date(body.dateAchat ?? new Date()),
      prixAchat: Number(body.prixAchat),
      poidsAchat: Number(body.poidsAchat ?? 0),
      statut: "EN_ENGRAISSEMENT",
      coutsEngraissement: 0,
      autresCouts: 0,
    },
  });

  // Historique
  await db.historique.create({
    data: {
      action: "CREATE_BOVIN",
      entiteType: "Bovin",
      entiteId: bovin.id,
      details: `Nouvel achat ${bovin.identifiant} (${espece === "OVIN" ? "ovin" : "bovin"}, ${bovin.race}) — ${bovin.prixAchat} FCFA, ${bovin.poidsAchat} kg`,
    },
  });

  return NextResponse.json(toBovin(bovin), { status: 201 });
}
