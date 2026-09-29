// GET /api/bovins — liste de tous les bovins
// POST /api/bovins — création d'un nouveau bovin (achat)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toBovin } from "@/lib/server-mappers";
import { nextBovinIdentifiant } from "@/lib/format";

export async function GET() {
  const bovins = await db.bovin.findMany({ orderBy: { identifiant: "asc" } });
  return NextResponse.json(bovins.map(toBovin));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const count = await db.bovin.count();
  const identifiant = nextBovinIdentifiant(await db.bovin.findMany({ select: { identifiant: true } }));

  const bovin = await db.bovin.create({
    data: {
      identifiant,
      race: body.race ?? "Zébu",
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
      details: `Nouvel achat ${bovin.identifiant} (${bovin.prixAchat} FCFA, ${bovin.poidsAchat} kg)`,
    },
  });

  return NextResponse.json(toBovin(bovin), { status: 201 });
}
