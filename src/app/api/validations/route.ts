// GET /api/validations — liste des validations
//   ?statut=EN_ATTENTE|VALIDEE|REJETEE  → filtre par statut
//   (sans statut)                       → toutes les validations
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const statut = url.searchParams.get("statut"); // "EN_ATTENTE" | "VALIDEE" | "REJETEE" | null

  const vals = await db.validation.findMany({
    where: statut ? { statut } : undefined,
    orderBy: { dateSaisie: "desc" },
    take: 100,
  });

  return NextResponse.json(
    vals.map((v) => ({
      id: v.id,
      entiteType: v.entiteType,
      entiteId: v.entiteId,
      action: v.action,
      statut: v.statut,
      saisiePar: v.saisiePar,
      validePar: v.validePar,
      dateSaisie: v.dateSaisie.toISOString(),
      dateValidation: v.dateValidation?.toISOString() ?? null,
      commentaire: v.commentaire,
    }))
  );
}
