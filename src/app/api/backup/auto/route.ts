// GET /api/backup/auto — crée une auto-sauvegarde si la dernière date de
// plus de 7 jours (cahier des charges §9 — sauvegarde automatique périodique).
//
// Cette route est conçue pour être appelée :
//   - périodiquement via un cron externe (ex: Vercel Cron → /api/backup/auto)
//   - au démarrage de l'app (peut être déclenché par le dashboard ou
//     par le composant BackupsView au montage)
//
// Réponse :
//   { due: boolean, created: boolean, lastBackupDate: string | null,
//     nextBackupDue: string | null, backup?: {...} }

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { isAutoBackupDue, createBackup } from "@/lib/backup";

export async function GET() {
  // Pas de restriction de rôle : la route peut être appelée par un cron sans
  // session. Toutefois on log pour traçabilité.
  try {
    const { due, lastBackupDate } = await isAutoBackupDue();
    if (!due) {
      const next = new Date((lastBackupDate ?? new Date()).getTime() + 7 * 24 * 60 * 60 * 1000);
      return NextResponse.json({
        due: false,
        created: false,
        lastBackupDate: lastBackupDate?.toISOString() ?? null,
        nextBackupDue: next.toISOString(),
      });
    }

    const backup = await createBackup("auto");
    console.log("💾 Auto-backup créé via /api/backup/auto:", backup.filename);
    return NextResponse.json({
      due: true,
      created: true,
      lastBackupDate: lastBackupDate?.toISOString() ?? null,
      nextBackupDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      backup,
    });
  } catch (e) {
    console.error("Auto-backup échoué:", e);
    return NextResponse.json(
      { due: true, created: false, error: e instanceof Error ? e.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

// Force la création d'une auto-sauvegarde (admin uniquement)
export async function POST() {
  const { forbidden } = await requireRole(["E2A"]);
  if (forbidden) {
    return NextResponse.json({ error: "Accès refusé — E2A uniquement" }, { status: 403 });
  }
  const backup = await createBackup("auto");
  return NextResponse.json({ created: true, backup }, { status: 201 });
}
