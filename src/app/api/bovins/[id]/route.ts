// GET /api/bovins/[id] — détail d'un bovin
// PUT /api/bovins/[id] — met à jour un bovin (race, sexe, espece, poidsAchat...)
// DELETE /api/bovins/[id] — supprime un bovin
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toBovin } from "@/lib/server-mappers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bovin = await db.bovin.findUnique({ where: { id } });
  if (!bovin) return NextResponse.json({ error: "Bovin introuvable" }, { status: 404 });
  return NextResponse.json(toBovin(bovin));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await db.bovin.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Bovin introuvable" }, { status: 404 });
  }

  const body = await req.json();

  // Champs modifiables — l'identifiant et les cumuls comptables sont figés.
  const data: Record<string, unknown> = {};
  if (typeof body.race === "string") data.race = body.race;
  if (typeof body.sexe === "string") data.sexe = body.sexe;
  if (typeof body.espece === "string") data.espece = body.espece;
  if (typeof body.gestionnaire === "string") data.gestionnaire = body.gestionnaire;
  if (body.poidsAchat !== undefined) data.poidsAchat = Number(body.poidsAchat);
  if (body.prixAchat !== undefined) data.prixAchat = Number(body.prixAchat);
  if (body.dateAchat !== undefined) data.dateAchat = new Date(body.dateAchat);

  const updated = await db.bovin.update({
    where: { id },
    data,
  });

  await db.historique.create({
    data: {
      action: "UPDATE_BOVIN",
      entiteType: "Bovin",
      entiteId: updated.id,
      details: `Modification ${updated.identifiant} — champs : ${Object.keys(data).join(", ") || "aucun"}`,
    },
  });

  return NextResponse.json(toBovin(updated));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await db.bovin.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Bovin introuvable" }, { status: 404 });
  }

  // Les relations (AlimentationBovin, DepenseBovin, Pese, Soin, Tag, Photo)
  // sont déclarées en onDelete: Cascade — Prisma s'occupe du nettoyage.
  await db.bovin.delete({ where: { id } });

  await db.historique.create({
    data: {
      action: "DELETE_BOVIN",
      entiteType: "Bovin",
      entiteId: id,
      details: `Suppression du bovin ${existing.identifiant} (${existing.race})`,
    },
  });

  return NextResponse.json({ success: true, id });
}
