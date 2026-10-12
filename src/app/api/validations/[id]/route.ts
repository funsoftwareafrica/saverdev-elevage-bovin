// PATCH /api/validations/[id] — valide ou rejette une opération
//
// Workflow à 2 niveaux (cahier des charges §9) :
//  - statut: "VALIDEE" → applique réellement l'opération en base via
//    applySaisieOperation() et marque la validation comme VALIDEE.
//  - statut: "REJETEE" → marque la validation comme REJETEE (avec commentaire
//    obligatoire). Aucune opération n'est appliquée.
//
// Sécurité : réservé au rôle E2A. Le saisiePar (Bénéficiaire) ne peut pas
// valider sa propre saisie.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { applySaisieOperation, deserializeSaisie } from "@/lib/saisie-ops";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const val = await db.validation.findUnique({ where: { id } });
  if (!val) {
    return NextResponse.json({ error: "Validation introuvable" }, { status: 404 });
  }
  return NextResponse.json({
    id: val.id,
    entiteType: val.entiteType,
    entiteId: val.entiteId,
    action: val.action,
    statut: val.statut,
    saisiePar: val.saisiePar,
    validePar: val.validePar,
    dateSaisie: val.dateSaisie.toISOString(),
    dateValidation: val.dateValidation?.toISOString() ?? null,
    commentaire: val.commentaire,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { forbidden, session } = await requireRole(["E2A"]);
  if (forbidden) {
    return NextResponse.json({ error: "Accès refusé — E2A uniquement" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const statut = body.statut === "VALIDEE" ? "VALIDEE" : "REJETEE";

  const val = await db.validation.findUnique({ where: { id } });
  if (!val) {
    return NextResponse.json({ error: "Validation introuvable" }, { status: 404 });
  }
  if (val.statut !== "EN_ATTENTE") {
    return NextResponse.json({ error: `Opération déjà traitée (${val.statut})` }, { status: 409 });
  }

  // Refus : commentaire obligatoire
  if (statut === "REJETEE" && !body.commentaire) {
    return NextResponse.json(
      { error: "Un commentaire est obligatoire pour refuser une saisie" },
      { status: 400 }
    );
  }

  // Validation : appliquer l'opération en base
  if (statut === "VALIDEE") {
    const payload = deserializeSaisie(val.action);
    if (!payload) {
      return NextResponse.json(
        { error: "Données de saisie corrompues (JSON invalide)" },
        { status: 500 }
      );
    }

    const result = await applySaisieOperation(payload);
    if (!result.ok) {
      return NextResponse.json(
        { error: `Échec de l'application : ${result.error ?? "erreur inconnue"}` },
        { status: result.status ?? 500 }
      );
    }

    // Met à jour la Validation avec l'ID réel de l'entité créée
    await db.validation.update({
      where: { id },
      data: {
        statut: "VALIDEE",
        validePar: session!.user.id,
        dateValidation: new Date(),
        commentaire: body.commentaire ?? null,
        entiteId: result.id ?? "applied",
      },
    });

    await db.historique.create({
      data: {
        action: "VALIDATION_VALIDEE",
        entiteType: val.entiteType,
        entiteId: result.id ?? val.id,
        userId: session!.user.id,
        details: `Saisie ${val.entiteType} validée et appliquée — ${result.identifiant ?? result.id}`,
      },
    });

    return NextResponse.json({
      id,
      statut: "VALIDEE",
      applied: true,
      entiteId: result.id,
      identifiant: result.identifiant,
      dateValidation: new Date().toISOString(),
    });
  }

  // Rejet
  await db.validation.update({
    where: { id },
    data: {
      statut: "REJETEE",
      validePar: session!.user.id,
      dateValidation: new Date(),
      commentaire: body.commentaire,
    },
  });

  await db.historique.create({
    data: {
      action: "VALIDATION_REJETEE",
      entiteType: val.entiteType,
      entiteId: val.id,
      userId: session!.user.id,
      details: `Saisie ${val.entiteType} rejetée — motif : ${body.commentaire}`,
    },
  });

  return NextResponse.json({
    id,
    statut: "REJETEE",
    commentaire: body.commentaire,
    dateValidation: new Date().toISOString(),
  });
}
