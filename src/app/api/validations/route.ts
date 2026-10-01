// GET /api/validations — liste des validations en attente
// PATCH /api/validations/[id] — valide ou rejette
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const vals = await db.validation.findMany({
    where: { statut: "EN_ATTENTE" },
    orderBy: { dateSaisie: "desc" },
  });
  return NextResponse.json(
    vals.map((v) => ({
      id: v.id,
      entiteType: v.entiteType,
      entiteId: v.entiteId,
      action: v.action,
      statut: v.statut,
      dateSaisie: v.dateSaisie.toISOString(),
      dateValidation: v.dateValidation?.toISOString() ?? null,
      commentaire: v.commentaire,
    }))
  );
}
