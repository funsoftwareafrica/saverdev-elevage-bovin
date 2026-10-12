// GET /api/depenses/[id] — détail d'une dépense
// PUT /api/depenses/[id] — met à jour + recalcule l'imputation (autresCouts)
// DELETE /api/depenses/[id] — supprime + annule l'imputation aux bovins
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toDepense } from "@/lib/server-mappers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const depense = await db.depense.findUnique({ where: { id } });
  if (!depense) {
    return NextResponse.json({ error: "Dépense introuvable" }, { status: 404 });
  }
  return NextResponse.json(toDepense(depense));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await db.depense.findUnique({
    where: { id },
    include: { bovins: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Dépense introuvable" }, { status: 404 });
  }

  const body = await req.json();

  // ----- 1. Annuler l'ancienne imputation -----
  const oldPart = existing.montant > 0 && existing.nbBovinsConcernes > 0
    ? existing.montant / existing.nbBovinsConcernes
    : 0;
  if (oldPart > 0) {
    await Promise.all(
      existing.bovins.map((db_) =>
        db.bovin.update({
          where: { id: db_.bovinId },
          data: { autresCouts: { decrement: oldPart } },
        })
      )
    );
  }
  await db.depenseBovin.deleteMany({ where: { depenseId: id } });

  // ----- 2. Nouveaux champs -----
  const date = body.date ? new Date(body.date) : existing.date;
  const categorie = typeof body.categorie === "string" ? body.categorie : existing.categorie;
  const libelle = typeof body.libelle === "string" ? body.libelle : existing.libelle;
  const montant = body.montant !== undefined ? Number(body.montant) : existing.montant;
  const nbBovins = body.nbBovinsConcernes !== undefined
    ? Number(body.nbBovinsConcernes)
    : existing.nbBovinsConcernes;

  const updated = await db.depense.update({
    where: { id },
    data: { date, categorie, libelle, montant, nbBovinsConcernes: nbBovins },
  });

  // ----- 3. Réimputer aux N premiers bovins actifs -----
  const part = nbBovins > 0 ? montant / nbBovins : 0;
  if (nbBovins > 0) {
    const bovinsActifs = await db.bovin.findMany({
      where: { statut: "EN_ENGRAISSEMENT" },
      take: nbBovins,
      orderBy: { dateAchat: "asc" },
    });
    if (bovinsActifs.length > 0) {
      await db.depenseBovin.createMany({
        data: bovinsActifs.map((b) => ({
          depenseId: id,
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
  }

  await db.historique.create({
    data: {
      action: "UPDATE_DEPENSE",
      entiteType: "Depense",
      entiteId: id,
      details: `Modification ${categorie} — ${libelle} (${montant} FCFA)`,
    },
  });

  return NextResponse.json(toDepense(updated));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await db.depense.findUnique({
    where: { id },
    include: { bovins: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Dépense introuvable" }, { status: 404 });
  }

  // Annuler l'imputation
  const oldPart = existing.nbBovinsConcernes > 0
    ? existing.montant / existing.nbBovinsConcernes
    : 0;
  if (oldPart > 0) {
    await Promise.all(
      existing.bovins.map((db_) =>
        db.bovin.update({
          where: { id: db_.bovinId },
          data: { autresCouts: { decrement: oldPart } },
        })
      )
    );
  }

  await db.depense.delete({ where: { id } });

  await db.historique.create({
    data: {
      action: "DELETE_DEPENSE",
      entiteType: "Depense",
      entiteId: id,
      details: `Suppression ${existing.categorie} — ${existing.libelle} (${existing.montant} FCFA, imputation annulée)`,
    },
  });

  return NextResponse.json({ success: true, id });
}
