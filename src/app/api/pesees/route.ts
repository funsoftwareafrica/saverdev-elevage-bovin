// GET /api/pesees — liste des pesées (avec info bovin)
// POST /api/pesees — enregistre une pesée
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const bovinId = url.searchParams.get("bovinId");
  const pesees = await db.pese.findMany({
    where: bovinId ? { bovinId } : undefined,
    orderBy: { date: "desc" },
  });

  // Récupère les identifiants/races des bovins concernés (relation non déclarée dans le schema)
  const bovinIds = [...new Set(pesees.map((p) => p.bovinId))];
  const bovins = await db.bovin.findMany({
    where: { id: { in: bovinIds } },
    select: { id: true, identifiant: true, race: true },
  });
  const bovinMap = new Map(bovins.map((b) => [b.id, b]));

  return NextResponse.json(
    pesees.map((p) => {
      const b = bovinMap.get(p.bovinId);
      return {
        id: p.id,
        bovinId: p.bovinId,
        identifiant: b?.identifiant ?? "—",
        race: b?.race ?? "—",
        date: p.date.toISOString(),
        poids: p.poids,
        methode: p.methode,
      };
    })
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pese = await db.pese.create({
    data: {
      bovinId: body.bovinId,
      poids: Number(body.poids),
      methode: body.methode ?? "Manuelle",
    },
  });
  await db.historique.create({
    data: {
      action: "PESEE",
      entiteType: "Bovin",
      entiteId: body.bovinId,
      details: `Pesée ${body.poids} kg (${body.methode ?? "Manuelle"})`,
    },
  });
  return NextResponse.json(pese, { status: 201 });
}
