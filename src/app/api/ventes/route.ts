// GET /api/ventes — liste des bovins vendus (avec marge calculée)
// POST /api/ventes — enregistre une vente (fige le coût, calcule la marge)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toBovin } from "@/lib/server-mappers";
import { computeBovinMarge } from "@/lib/calculations";

export async function GET() {
  const vendus = await db.bovin.findMany({
    where: { statut: "VENDU" },
    orderBy: { dateVente: "desc" },
  });
  return NextResponse.json(vendus.map(toBovin));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const bovinId = body.bovinId;
  const prixVente = Number(body.prixVente);
  const dateVente = new Date(body.dateVente ?? new Date());

  // Vérifie que le bovin est actif
  const bovin = await db.bovin.findUnique({ where: { id: bovinId } });
  if (!bovin || bovin.statut !== "EN_ENGRAISSEMENT") {
    return NextResponse.json(
      { error: "Bovin introuvable ou déjà vendu" },
      { status: 400 }
    );
  }

  // Marque comme vendu + fige le prix
  const updated = await db.bovin.update({
    where: { id: bovinId },
    data: {
      statut: "VENDU",
      prixVente,
      dateVente,
      clientVente: body.client ?? null,
    },
  });

  const mapped = toBovin(updated);
  const { coutRevient, marge } = computeBovinMarge(mapped);

  // Historique
  await db.historique.create({
    data: {
      action: "VENTE",
      entiteType: "Bovin",
      entiteId: bovin.id,
      details: `Vente ${bovin.identifiant} — ${prixVente} FCFA (marge ${marge} FCFA, coût revient ${coutRevient} FCFA)`,
    },
  });

  return NextResponse.json({ ...mapped, coutRevient, marge }, { status: 201 });
}
