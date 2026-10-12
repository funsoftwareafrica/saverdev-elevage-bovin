// GET /api/paturages/[id] — détail d'un pâturage
// PUT /api/paturages/[id] — met à jour (nom, surface, localisation, capacite)
// DELETE /api/paturages/[id] — supprime le pâturage
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function serializePaturage(p: {
  id: string;
  nom: string;
  surface: number;
  coordonnees: string | null;
  capacite: number;
  createdAt: Date;
}) {
  return {
    id: p.id,
    nom: p.nom,
    surface: p.surface,
    coordonnees: p.coordonnees,
    capacite: p.capacite,
    createdAt: p.createdAt.toISOString(),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const paturage = await db.paturage.findUnique({ where: { id } });
  if (!paturage) {
    return NextResponse.json({ error: "Pâturage introuvable" }, { status: 404 });
  }
  return NextResponse.json(serializePaturage(paturage));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await db.paturage.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Pâturage introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof body.nom === "string") data.nom = body.nom;
  if (body.surface !== undefined) data.surface = Number(body.surface);
  if (body.coordonnees !== undefined) data.coordonnees = body.coordonnees ?? null;
  if (body.capacite !== undefined) data.capacite = Number(body.capacite);

  const updated = await db.paturage.update({ where: { id }, data });

  await db.historique.create({
    data: {
      action: "UPDATE_PATURAGE",
      entiteType: "Paturage",
      entiteId: id,
      details: `Modification pâturage ${updated.nom} — ${updated.surface} ha / ${updated.capacite} bovins`,
    },
  });

  return NextResponse.json(serializePaturage(updated));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await db.paturage.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Pâturage introuvable" }, { status: 404 });
  }

  await db.paturage.delete({ where: { id } });

  await db.historique.create({
    data: {
      action: "DELETE_PATURAGE",
      entiteType: "Paturage",
      entiteId: id,
      details: `Suppression pâturage ${existing.nom}`,
    },
  });

  return NextResponse.json({ success: true, id });
}
