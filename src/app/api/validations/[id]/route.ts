// PATCH /api/validations/[id] — valide ou rejette une opération
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const statut = body.statut === "VALIDE" ? "VALIDE" : "REJETE";

  const val = await db.validation.update({
    where: { id },
    data: { statut, dateValidation: new Date(), commentaire: body.commentaire ?? null },
  });

  // Historique
  await db.historique.create({
    data: {
      action: `VALIDATION_${statut}`,
      entiteType: val.entiteType,
      entiteId: val.entiteId,
      details: `Opération ${statut.toLowerCase()} — ${val.action}`,
    },
  });

  return NextResponse.json({
    id: val.id,
    statut: val.statut,
    dateValidation: val.dateValidation?.toISOString() ?? null,
  });
}
