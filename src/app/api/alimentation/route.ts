// GET /api/alimentation — liste des achats d'aliments
// POST /api/alimentation — enregistre un achat d'aliment + imputation par tête
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toAlimentation } from "@/lib/server-mappers";

export async function GET() {
  const alimentations = await db.alimentation.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(alimentations.map(toAlimentation));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const coutTotal = Number(body.coutTotal);
  const nbBovins = Number(body.nbBovinsConcernes);
  const coutParTete = nbBovins > 0 ? Math.round(coutTotal / nbBovins) : 0;

  const alimentation = await db.alimentation.create({
    data: {
      date: new Date(body.date ?? new Date()),
      produit: body.produit,
      quantite: Number(body.quantite),
      unite: body.unite ?? "sac",
      coutTotal,
      nbBovinsConcernes: nbBovins,
      coutParTete,
      commentaire: body.commentaire ?? null,
    },
  });

  // Imputation aux N premiers bovins actifs
  const bovinsActifs = await db.bovin.findMany({
    where: { statut: "EN_ENGRAISSEMENT" },
    take: nbBovins,
    orderBy: { dateAchat: "asc" },
  });

  await db.alimentationBovin.createMany({
    data: bovinsActifs.map((b) => ({
      alimentationId: alimentation.id,
      bovinId: b.id,
      partImputee: coutParTete,
    })),
  });

  // Met à jour le cumul des coûts d'engraissement de chaque bovin concerné
  await Promise.all(
    bovinsActifs.map((b) =>
      db.bovin.update({
        where: { id: b.id },
        data: { coutsEngraissement: { increment: coutParTete } },
      })
    )
  );

  // Historique
  await db.historique.create({
    data: {
      action: "ALIMENTATION",
      entiteType: "Alimentation",
      entiteId: alimentation.id,
      details: `Achat ${body.quantite} ${body.unite ?? "sac"} ${body.produit} — ${coutTotal} FCFA imputés à ${bovinsActifs.length} bovins (${coutParTete}/tête)`,
    },
  });

  return NextResponse.json(toAlimentation(alimentation), { status: 201 });
}
