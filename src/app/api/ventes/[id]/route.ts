// DELETE /api/ventes/[id] — annule une vente (remet le bovin en EN_ENGRAISSEMENT)
//
// ⚠️ Une vente fige le coût de revient ; on n'expose PAS de route PUT
//    pour ne pas casser la comptabilité (marge historique).
//
// Le DELETE d'une vente :
//   1. Remet le bovin en statut EN_ENGRAISSEMENT
//   2. Efface dateVente / prixVente / clientVente
//   3. Ne touche pas aux coûts (coutsEngraissement, autresCouts) qui restent cumulés
//   4. Log dans Historique (action ANNULATION_VENTE)
//
// Retourne le bovin mis à jour.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toBovin } from "@/lib/server-mappers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bovin = await db.bovin.findUnique({ where: { id } });
  if (!bovin || bovin.statut !== "VENDU") {
    return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
  }
  return NextResponse.json(toBovin(bovin));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await db.bovin.findUnique({ where: { id } });
  if (!existing || existing.statut !== "VENDU") {
    return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
  }

  // Remet le bovin en engraissement + efface les champs de vente
  const updated = await db.bovin.update({
    where: { id },
    data: {
      statut: "EN_ENGRAISSEMENT",
      dateVente: null,
      prixVente: 0,
      clientVente: null,
    },
  });

  await db.historique.create({
    data: {
      action: "ANNULATION_VENTE",
      entiteType: "Bovin",
      entiteId: id,
      details: `Annulation vente ${existing.identifiant} — vente du ${existing.dateVente?.toISOString() ?? "?"} (${existing.prixVente} FCFA) remise en engraissement`,
    },
  });

  return NextResponse.json(toBovin(updated));
}
