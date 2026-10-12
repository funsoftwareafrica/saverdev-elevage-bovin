// lib/backup.ts — sauvegardes JSON complètes de la base (cahier des charges §9).
// Exporte toutes les tables dans un fichier JSON daté + crée un enregistrement Backup.

import { promises as fs } from "fs";
import path from "path";
import { db } from "@/lib/db";

const BACKUPS_DIR = path.join(process.cwd(), "backups");

// Convertit un Date Prisma en ISO string pour le JSON
function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

/** Exporte toutes les tables en un objet JSON sérialisable. */
async function exportAllData(): Promise<{ data: Record<string, unknown>; totalEntities: number }> {
  const [
    users, bovins, alimentations, alimentationBovins, depenses, depenseBovins,
    financements, echeances, alertes, historiques, pesees, parametres, paturages, notifications, backups,
    capitalMouvements, stockMouvements, validations, soins, tags, photos,
  ] = await Promise.all([
    db.user.findMany(),
    db.bovin.findMany(),
    db.alimentation.findMany(),
    db.alimentationBovin.findMany(),
    db.depense.findMany(),
    db.depenseBovin.findMany(),
    db.financement.findMany(),
    db.echeance.findMany(),
    db.alerte.findMany(),
    db.historique.findMany(),
    db.pese.findMany(),
    db.parametre.findMany(),
    db.paturage.findMany(),
    db.notification.findMany(),
    db.backup.findMany(),
    db.capitalMouvement.findMany(),
    db.stockMouvement.findMany(),
    db.validation.findMany(),
    db.soin.findMany(),
    db.tag.findMany(),
    db.photo.findMany(),
  ]);

  const data = {
    meta: {
      app: "SAVERDEV Élevage Bovin",
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
    },
    users: users.map((u) => ({ ...u, password: "***REDACTED***", createdAt: iso(u.createdAt), updatedAt: iso(u.updatedAt) })),
    bovins: bovins.map((b) => ({ ...b, dateAchat: iso(b.dateAchat), dateVente: iso(b.dateVente), createdAt: iso(b.createdAt), updatedAt: iso(b.updatedAt) })),
    alimentations: alimentations.map((a) => ({ ...a, date: iso(a.date), createdAt: iso(a.createdAt) })),
    alimentationBovins: alimentationBovins.map((ab) => ({ ...ab })),
    depenses: depenses.map((d) => ({ ...d, date: iso(d.date), createdAt: iso(d.createdAt) })),
    depenseBovins: depenseBovins.map((db_) => ({ ...db_ })),
    financements: financements.map((f) => ({ ...f, dateOctroi: iso(f.dateOctroi), createdAt: iso(f.createdAt) })),
    echeances: echeances.map((e) => ({ ...e, datePrevue: iso(e.datePrevue), datePayee: iso(e.datePayee) })),
    alertes: alertes.map((a) => ({ ...a, date: iso(a.date) })),
    historiques: historiques.map((h) => ({ ...h, date: iso(h.date) })),
    pesees: pesees.map((p) => ({ ...p, date: iso(p.date), createdAt: iso(p.createdAt) })),
    parametres: parametres.map((p) => ({ ...p, updatedAt: iso(p.updatedAt) })),
    paturages: paturages.map((p) => ({ ...p, createdAt: iso(p.createdAt) })),
    notifications: notifications.map((n) => ({ ...n, date: iso(n.date) })),
    backups: backups.map((b) => ({ ...b, date: iso(b.date), createdAt: iso(b.createdAt) })),
    capitalMouvements: capitalMouvements.map((m) => ({ ...m, date: iso(m.date), createdAt: iso(m.createdAt) })),
    stockMouvements: stockMouvements.map((m) => ({ ...m, date: iso(m.date), createdAt: iso(m.createdAt) })),
    validations: validations.map((v) => ({
      ...v,
      dateSaisie: iso(v.dateSaisie),
      dateValidation: iso(v.dateValidation),
    })),
    soins: soins.map((s) => ({
      ...s,
      date: iso(s.date),
      prochainRappel: iso(s.prochainRappel),
      createdAt: iso(s.createdAt),
    })),
    tags: tags.map((t) => ({ ...t, createdAt: iso(t.createdAt) })),
    photos: photos.map((p) => ({ ...p, createdAt: iso(p.createdAt) })),
  };

  const totalEntities =
    users.length + bovins.length + alimentations.length + alimentationBovins.length +
    depenses.length + depenseBovins.length + financements.length + echeances.length +
    alertes.length + historiques.length + pesees.length + parametres.length +
    paturages.length + notifications.length + capitalMouvements.length + stockMouvements.length +
    validations.length + soins.length + tags.length + photos.length;

  return { data, totalEntities };
}

/** Crée une sauvegarde (JSON sur disque + enregistrement Backup en DB). */
export async function createBackup(type: "auto" | "manual" = "manual") {
  await fs.mkdir(BACKUPS_DIR, { recursive: true });

  const { data, totalEntities } = await exportAllData();
  const json = JSON.stringify(data, null, 2);
  const size = Buffer.byteLength(json, "utf-8");

  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `saverdev-backup-${ts}.json`;
  const filepath = path.join(BACKUPS_DIR, filename);

  await fs.writeFile(filepath, json, "utf-8");

  const backup = await db.backup.create({
    data: {
      date: now,
      filename,
      size,
      type,
      entities: totalEntities,
    },
  });

  return {
    id: backup.id,
    date: backup.date.toISOString(),
    filename,
    size,
    type,
    entities: totalEntities,
  };
}

/** Liste toutes les sauvegardes (plus récentes d'abord). */
export async function listBackups() {
  const backups = await db.backup.findMany({ orderBy: { date: "desc" }, take: 30 });
  return backups.map((b) => ({
    id: b.id,
    date: b.date.toISOString(),
    filename: b.filename,
    size: b.size,
    type: b.type,
    entities: b.entities,
  }));
}

/** Retourne le chemin du fichier d'une sauvegarde. */
export function getBackupFilePath(filename: string): string {
  return path.join(BACKUPS_DIR, filename);
}

/** Vérifie si une auto-sauvegarde est due (> 7 jours depuis la dernière). */
export async function isAutoBackupDue(): Promise<{ due: boolean; lastBackupDate: Date | null }> {
  const lastAuto = await db.backup.findFirst({
    where: { type: "auto" },
    orderBy: { date: "desc" },
  });

  if (!lastAuto) return { due: true, lastBackupDate: null };

  const daysSince = (Date.now() - lastAuto.date.getTime()) / (1000 * 60 * 60 * 24);
  return { due: daysSince >= 7, lastBackupDate: lastAuto.date };
}

/** Crée une auto-sauvegarde si due (appelée au chargement du dashboard). */
export async function maybeAutoBackup(): Promise<void> {
  try {
    const { due } = await isAutoBackupDue();
    if (due) {
      await createBackup("auto");
      console.log("💾 Auto-backup créé");
    }
  } catch (e) {
    // Ne fait pas planter le dashboard si l'auto-backup échoue
    console.error("Auto-backup échoué:", e);
  }
}
