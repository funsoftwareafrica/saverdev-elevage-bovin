// GET /api/alimentation/[id] — détail d'une alimentation
// PUT /api/alimentation/[id] — met à jour + recalcule coutParTete et imputations
// DELETE /api/alimentation/[id] — supprime + annule l'imputation aux bovins concernés
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toAlimentation } from "@/lib/server-mappers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const alimentation = await db.alimentation.findUnique({ where: { id } });
  if (!alimentation) {
    return NextResponse.json({ error: "Alimentation introuvable" }, { status: 404 });
  }
  return NextResponse.json(toAlimentation(alimentation));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await db.alimentation.findUnique({
    where: { id },
    include: { bovins: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Alimentation introuvable" }, { status: 404 });
  }

  const body = await req.json();

  // ----- 1. Annuler l'ancienne imputation sur les bovins concernés -----
  const oldCoutParTete = existing.coutParTete;
  await Promise.all(
    existing.bovins.map((ab) =>
      db.bovin.update({
        where: { id: ab.bovinId },
        data: { coutsEngraissement: { decrement: oldCoutParTete } },
      })
    )
  );
  await db.alimentationBovin.deleteMany({ where: { alimentationId: id } });

  // ----- 2. Calculer les nouveaux montants -----
  const date = body.date ? new Date(body.date) : existing.date;
  const produit = typeof body.produit === "string" ? body.produit : existing.produit;
  const quantite = body.quantite !== undefined ? Number(body.quantite) : existing.quantite;
  const unite = typeof body.unite === "string" ? body.unite : existing.unite;
  const coutTotal =
    body.coutTotal !== undefined ? Number(body.coutTotal) : existing.coutTotal;
  const nbBovinsConcernes =
    body.nbBovinsConcernes !== undefined
      ? Number(body.nbBovinsConcernes)
      : existing.nbBovinsConcernes;
  const commentaire =
    body.commentaire !== undefined ? body.commentaire : existing.commentaire;
  const coutParTete = nbBovinsConcernes > 0 ? Math.round(coutTotal / nbBovinsConcernes) : 0;

  // ----- 3. Mettre à jour l'enregistrement -----
  const updated = await db.alimentation.update({
    where: { id },
    data: {
      date,
      produit,
      quantite,
      unite,
      coutTotal,
      nbBovinsConcernes,
      coutParTete,
      commentaire: commentaire ?? null,
    },
  });

  // ----- 4. Réimputer aux N premiers bovins actifs -----
  const bovinsActifs = await db.bovin.findMany({
    where: { statut: "EN_ENGRAISSEMENT" },
    take: nbBovinsConcernes,
    orderBy: { dateAchat: "asc" },
  });

  if (bovinsActifs.length > 0) {
    await db.alimentationBovin.createMany({
      data: bovinsActifs.map((b) => ({
        alimentationId: id,
        bovinId: b.id,
        partImputee: coutParTete,
      })),
    });
    await Promise.all(
      bovinsActifs.map((b) =>
        db.bovin.update({
          where: { id: b.id },
          data: { coutsEngraissement: { increment: coutParTete } },
        })
      )
    );
  }

  await db.historique.create({
    data: {
      action: "UPDATE_ALIMENTATION",
      entiteType: "Alimentation",
      entiteId: id,
      details: `Modification achat ${produit} — ${coutTotal} FCFA / ${nbBovinsConcernes} têtes (${coutParTete}/tête)`,
    },
  });

  return NextResponse.json(toAlimentation(updated));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await db.alimentation.findUnique({
    where: { id },
    include: { bovins: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Alimentation introuvable" }, { status: 404 });
  }

  // Annuler l'imputation aux bovins concernés
  const coutParTete = existing.coutParTete;
  await Promise.all(
    existing.bovins.map((ab) =>
      db.bovin.update({
        where: { id: ab.bovinId },
        data: { coutsEngraissement: { decrement: coutParTete } },
      })
    )
  );

  // La suppression cascade AlimentationBovin (onDelete: Cascade)
  await db.alimentation.delete({ where: { id } });

  await db.historique.create({
    data: {
      action: "DELETE_ALIMENTATION",
      entiteType: "Alimentation",
      entiteId: id,
      details: `Suppression achat ${existing.produit} — ${existing.coutTotal} FCFA (imputation ${coutParTete}/tête annulée)`,
    },
  });

  return NextResponse.json({ success: true, id });
}
