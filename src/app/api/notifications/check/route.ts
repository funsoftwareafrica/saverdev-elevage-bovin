// GET /api/notifications/check — génère automatiquement les alertes manquantes
//
// Règles de génération (cahier des charges §9 — Centre de notifications) :
//   1. Échéance approchante J-7 et J-1 : Notification ECHEANCE
//   2. Stock bas (< 20 sacs) : Notification STOCK
//   3. Dépenses mensuelles > 500 000 FCFA : Notification BUDGET
//   4. Mortalité récente (> 0 bovin MORT sur les 30 derniers jours) :
//      Notification MORTALITE
//
// Cette route est idempotente : elle ne crée pas de doublons (un hash du
// message est stocké dans `lien` pour détecter les doublons).
//
// Appel recommandé : toutes les heures via cron externe, ou au démarrage
// de l'app via le composant NotificationCenter (mount).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Hash simple (string → 8 premiers caractères d'un SHA-like)
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

async function ensureNotif(type: string, titre: string, message: string, lien: string | null = null) {
  const key = `auto:${type}:${hash(message)}`;
  // Recherche par `lien` (clé de dédoublonnage)
  const existing = await db.notification.findFirst({
    where: { lien: key },
  });
  if (existing) return { created: false, id: existing.id };
  const n = await db.notification.create({
    data: { type, titre, message, lien: key, lu: false },
  });
  return { created: true, id: n.id };
}

export async function GET() {
  const created: { type: string; titre: string; message: string }[] = [];
  const now = new Date();
  const dans7j = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dans1j = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

  // 1. Échéances approchantes (J-7 et J-1)
  try {
    const echeances = await db.echeance.findMany({
      where: { statut: { in: ["A_PAYER", "EN_RETARD"] } },
      include: { financement: true },
    });
    for (const e of echeances) {
      const dPrev = new Date(e.datePrevue);
      if (dPrev >= now && dPrev <= dans7j) {
        const isJ1 = dPrev <= dans1j;
        const msg = `${isJ1 ? "J-1" : "J-7"} — Échéance ${e.numero} (${e.montant.toLocaleString("fr-FR")} FCFA) prévue le ${dPrev.toLocaleDateString("fr-FR")} (${e.financement?.bailleur ?? "—"})`;
        const res = await ensureNotif(
          "ECHEANCE",
          isJ1 ? "Échéance demain" : "Échéance sous 7 jours",
          msg
        );
        if (res.created) created.push({ type: "ECHEANCE", titre: isJ1 ? "Échéance demain" : "Échéance sous 7 jours", message: msg });
      }
    }
  } catch (e) {
    console.error("notif echeances:", e);
  }

  // 2. Stock bas (< 20 sacs)
  try {
    const mvts = await db.stockMouvement.findMany();
    const stockParType: Record<string, number> = {};
    for (const m of mvts) {
      stockParType[m.typeAliment] = (stockParType[m.typeAliment] || 0) + m.entree - m.sortie;
    }
    for (const [type, restant] of Object.entries(stockParType)) {
      if (restant < 20) {
        const msg = `Stock ${type} bas : ${restant} sacs restants`;
        const res = await ensureNotif(
          "STOCK",
          restant < 10 ? "Stock critique" : "Stock bas",
          msg
        );
        if (res.created) created.push({ type: "STOCK", titre: restant < 10 ? "Stock critique" : "Stock bas", message: msg });
      }
    }
  } catch (e) {
    console.error("notif stock:", e);
  }

  // 3. Dépenses mensuelles > 500 000 FCFA
  try {
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const depenses = await db.depense.findMany({ where: { date: { gte: debutMois } } });
    const total = depenses.reduce((s, d) => s + d.montant, 0);
    if (total > 500000) {
      const msg = `Dépenses du mois en cours : ${total.toLocaleString("fr-FR")} FCFA (seuil 500 000 FCFA)`;
      const res = await ensureNotif("BUDGET", "Dépenses mensuelles élevées", msg);
      if (res.created) created.push({ type: "BUDGET", titre: "Dépenses mensuelles élevées", message: msg });
    }
  } catch (e) {
    console.error("notif budget:", e);
  }

  // 4. Mortalité récente
  try {
    const depuis30j = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const morts = await db.bovin.findMany({
      where: { statut: "MORT", updatedAt: { gte: depuis30j } },
    });
    if (morts.length > 0) {
      const msg = `${morts.length} mortalité(s) récente(s) sur les 30 derniers jours — à surveiller`;
      const res = await ensureNotif("MORTALITE", "Mortalité récente", msg);
      if (res.created) created.push({ type: "MORTALITE", titre: "Mortalité récente", message: msg });
    }
  } catch (e) {
    console.error("notif mortalite:", e);
  }

  return NextResponse.json({
    checkedAt: now.toISOString(),
    created: created.length,
    notifications: created,
  });
}
