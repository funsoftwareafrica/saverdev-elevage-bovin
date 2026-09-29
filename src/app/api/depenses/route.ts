// GET /api/depenses — liste des dépenses d'exploitation
// POST /api/depenses — enregistre une dépense + imputation optionnelle
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toDepense } from "@/lib/server-mappers";

export async function GET() {
  const depenses = await db.depense.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(depenses.map(toDepense));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const montant = Number(body.montant);
  const nbBovins = Number(body.nbBovinsConcernes ?? 0);
  const part = nbBovins > 0 ? montant / nbBovins : 0;

  const depense = await db.depense.create({
    data: {
      date: new Date(body.date ?? new Date()),
      categorie: body.categorie,
      libelle: body.libelle,
      montant,
      nbBovinsConcernes: nbBovins,
    },
  });

  // Imputation aux N premiers bovins actifs
  if (nbBovins > 0) {
    const bovinsActifs = await db.bovin.findMany({
      where: { statut: "EN_ENGRAISSEMENT" },
      take: nbBovins,
      orderBy: { dateAchat: "asc" },
    });
    await db.depenseBovin.createMany({
      data: bovinsActifs.map((b) => ({
        depenseId: depense.id,
        bovinId: b.id,
        partImputee: part,
      })),
    });
    await Promise.all(
      bovinsActifs.map((b) =>
        db.bovin.update({
          where: { id: b.id },
          data: { autresCouts: { increment: part } },
        })
      )
    );
  }

  // Historique
  await db.historique.create({
    data: {
      action: "DEPENSE",
      entiteType: "Depense",
      entiteId: depense.id,
      details: `${body.categorie} — ${body.libelle} (${montant} FCFA)`,
    },
  });

  return NextResponse.json(toDepense(depense), { status: 201 });
}
