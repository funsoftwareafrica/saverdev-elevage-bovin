// DELETE /api/backup/[id] — supprime une sauvegarde (E2A only)
//
// Cette route complète la protection RBAC de l'endpoint backup : auparavant,
// seul GET (liste + download) et POST (création) étaient exposés. La suppression
// n'était pas implémentée — l'E2A ne pouvait pas nettoyer les backups obsolètes.
//
// Comportement :
//   1. Vérifie le rôle E2A (requireRole(["E2A"])).
//   2. Supprime l'enregistrement en DB (Backup).
//   3. Tente de supprimer le fichier disque (dev local). Tolérant si le
//      fichier n'existe pas (prod serverless Vercel : fs read-only).
//   4. Log dans Historique (action BACKUP_DELETE).

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getBackupFilePath } from "@/lib/backup";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { forbidden } = await requireRole(["E2A"]);
  if (forbidden) {
    return NextResponse.json(
      { error: "Accès refusé — admin uniquement" },
      { status: 403 }
    );
  }
  const { id } = await params;
  const existing = await db.backup.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Sauvegarde introuvable" }, { status: 404 });
  }

  // Supprime le fichier disque (dev local). Tolérant si absent ou fs read-only.
  try {
    const filepath = getBackupFilePath(existing.filename);
    await fs.unlink(filepath);
  } catch {
    // Fichier absent (peut-être supprimé manuellement) ou fs read-only en prod.
    // On continue quand même pour supprimer l'enregistrement DB.
  }

  await db.backup.delete({ where: { id } });

  await db.historique.create({
    data: {
      action: "BACKUP_DELETE",
      entiteType: "Backup",
      entiteId: id,
      details: `Sauvegarde supprimée — ${existing.filename} (${existing.type}, ${existing.entities} entités)`,
    },
  }).catch(() => null);

  return NextResponse.json({ success: true, id });
}
