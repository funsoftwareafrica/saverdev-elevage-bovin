// GET /api/pesees/[id] — détail d'une pesée
// PUT /api/pesees/[id] — met à jour (date, poids, methode)
// DELETE /api/pesees/[id] — supprime la pesée
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function serializePese(p: { id: string; bovinId: string; date: Date; poids: number; methode: string }) {
  return {
    id: p.id,
    bovinId: p.bovinId,
    date: p.date.toISOString(),
    poids: p.poids,
    methode: p.methode,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pese = await db.pese.findUnique({ where: { id } });
  if (!pese) {
    return NextResponse.json({ error: "Pesée introuvable" }, { status: 404 });
  }
  return NextResponse.json(serializePese(pese));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await db.pese.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Pesée introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.date !== undefined) data.date = new Date(body.date);
  if (body.poids !== undefined) data.poids = Number(body.poids);
  if (typeof body.methode === "string") data.methode = body.methode;

  const updated = await db.pese.update({ where: { id }, data });

  await db.historique.create({
    data: {
      action: "UPDATE_PESEE",
      entiteType: "Pese",
      entiteId: id,
      details: `Modification pesée — ${updated.poids} kg (${updated.methode})`,
    },
  });

  return NextResponse.json(serializePese(updated));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await db.pese.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Pesée introuvable" }, { status: 404 });
  }

  await db.pese.delete({ where: { id } });

  await db.historique.create({
    data: {
      action: "DELETE_PESEE",
      entiteType: "Pese",
      entiteId: id,
      details: `Suppression pesée — ${existing.poids} kg`,
    },
  });

  return NextResponse.json({ success: true, id });
}
