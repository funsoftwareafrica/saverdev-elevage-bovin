// PUT    /api/soins/[id] — met à jour un soin (date, type, libellé, cout, notes)
// DELETE /api/soins/[id] — supprime un soin

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function computeNextRappel(dateSoin: Date, type: string): Date | null {
  const t = (type ?? "").toLowerCase();
  let months: number | null = null;
  if (t.includes("fmd")) months = 6;
  else if (t.includes("ppb")) months = 12;
  else if (t.includes("antiparas") || t.includes("antiparasitaire")) months = 3;
  else if (t.includes("vermifuge") || t.includes("vermif")) months = 3;
  else if (t.includes("charbon")) months = 12;
  else if (t.includes("vaccin")) months = 6;
  if (!months) return null;
  const next = new Date(dateSoin);
  next.setMonth(next.getMonth() + months);
  return next;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const existing = await db.soin.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Soin introuvable" }, { status: 404 });
  }

  const dateSoin = body.date ? new Date(body.date) : existing.date;
  const type = body.type ?? existing.type;

  // Recalcule le rappel si la date ou le type change
  let prochainRappel = existing.prochainRappel;
  if (body.date || body.type) {
    prochainRappel = body.prochainRappel ? new Date(body.prochainRappel) : computeNextRappel(dateSoin, type);
  }

  const updated = await db.soin.update({
    where: { id },
    data: {
      date: dateSoin,
      type,
      libelle: body.libelle ?? existing.libelle,
      cout: body.cout !== undefined ? Number(body.cout) : existing.cout,
      prochainRappel: prochainRappel ?? null,
      notes: body.notes ?? existing.notes,
    },
  });

  await db.historique.create({
    data: {
      action: "SOIN_UPDATE",
      entiteType: "Bovin",
      entiteId: updated.bovinId,
      details: `Soin modifié — ${updated.type} (${updated.libelle})`,
    },
  });

  return NextResponse.json({
    id: updated.id,
    bovinId: updated.bovinId,
    date: updated.date.toISOString(),
    type: updated.type,
    libelle: updated.libelle,
    cout: updated.cout,
    prochainRappel: updated.prochainRappel?.toISOString() ?? null,
    notes: updated.notes,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await db.soin.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Soin introuvable" }, { status: 404 });
  }
  await db.soin.delete({ where: { id } });
  await db.historique.create({
    data: {
      action: "SOIN_DELETE",
      entiteType: "Bovin",
      entiteId: existing.bovinId,
      details: `Soin supprimé — ${existing.type} (${existing.libelle})`,
    },
  });
  return NextResponse.json({ ok: true });
}
