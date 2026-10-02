// GET /api/rapport-bailleur — synthèse mensuelle pour le bailleur (modèle Excel E2A)
// Retourne : KPIs + données mensuelles (12 mois) + structure des coûts + alertes.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toBovin, toAlimentation, toDepense, toFinancement, toAlerte } from "@/lib/server-mappers";
import type { RapportMensuel, RapportBailleur } from "@/lib/types";

/** Clé mois "YYYY-MM" d'une date ISO. */
function monthKey(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Liste des 12 mois de l'exercice (Jan → Déc de l'année courante). */
function exerciceMonths(year: number): { key: string; label: string }[] {
  const labels = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
  return labels.map((label, i) => ({
    key: `${year}-${String(i + 1).padStart(2, "0")}`,
    label,
  }));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const yearParam = url.searchParams.get("annee");
  const now = new Date();

  const [bovinsRaw, alimentations, depenses, financementRows, alertes] = await Promise.all([
    db.bovin.findMany({ orderBy: { identifiant: "asc" } }),
    db.alimentation.findMany({ orderBy: { date: "desc" } }),
    db.depense.findMany({ orderBy: { date: "desc" } }),
    db.financement.findMany({ include: { echeances: true } }),
    db.alerte.findMany({ orderBy: { date: "desc" } }),
  ]);
  const bovins = bovinsRaw.map(toBovin);

  // Auto-détection de l'année : si l'année demandée n'a aucune donnée,
  // on prend l'année de l'activité la plus récente (achat ou vente).
  let year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  const hasDataInYear = (y: number) =>
    bovins.some((b) => new Date(b.dateAchat).getFullYear() === y || (b.dateVente && new Date(b.dateVente).getFullYear() === y));
  if (!hasDataInYear(year)) {
    // Trouver l'année avec le plus de données
    const years = new Set<number>();
    for (const b of bovins) {
      years.add(new Date(b.dateAchat).getFullYear());
      if (b.dateVente) years.add(new Date(b.dateVente).getFullYear());
    }
    if (years.size > 0) year = Math.max(...years);
  }

  const financement = financementRows[0] ? toFinancement(financementRows[0]) : null;
  const montantFinance = financement?.montantFinance ?? 0;

  const months = exerciceMonths(year);

  // Pré-calcul des échéances payées
  const echeancesPayees = financement?.echeances.filter((e) => e.statut === "PAYEE") ?? [];

  const monthly: RapportMensuel[] = months.map((m) => {
    const endOfMonth = new Date(year, parseInt(m.key.split("-")[1], 10), 0, 23, 59, 59);
    const bovinsActifsMois = bovins.filter((b) => {
      const achat = new Date(b.dateAchat);
      if (achat > endOfMonth) return false;
      if (b.statut === "EN_ENGRAISSEMENT") return true;
      if (b.statut === "VENDU" && b.dateVente) return new Date(b.dateVente) > endOfMonth;
      return false;
    });

    const achatsMois = bovins.filter((b) => monthKey(b.dateAchat) === m.key);
    const ventesMois = bovins.filter((b) => b.statut === "VENDU" && b.dateVente && monthKey(b.dateVente) === m.key);
    const mortaliteMois = bovins.filter((b) => b.statut === "MORT" && monthKey(b.dateAchat) === m.key);

    const valeurCheptel = bovinsActifsMois.reduce((s, b) => s + b.prixAchat + b.coutsEngraissement, 0);

    const alimMois = alimentations.filter((a) => monthKey(a.date) === m.key);
    const sacsConsommes = alimMois.reduce((s, a) => s + a.quantite, 0);
    const coutAlimentation = alimMois.reduce((s, a) => s + a.coutTotal, 0);

    const ca = ventesMois.reduce((s, b) => s + b.prixVente, 0);
    const coutAchat = ventesMois.reduce((s, b) => s + b.prixAchat, 0);
    const coutEngraissement = ventesMois.reduce((s, b) => s + b.coutsEngraissement + b.autresCouts, 0);
    const margeTotale = ca - coutAchat - coutEngraissement;

    const coutAlimParTete = bovinsActifsMois.length > 0 ? coutAlimentation / bovinsActifsMois.length : 0;
    const margeParTete = ventesMois.length > 0 ? margeTotale / ventesMois.length : 0;

    const financementUtilise = echeancesPayees
      .filter((e) => e.datePayee && new Date(e.datePayee) <= endOfMonth)
      .reduce((s, e) => s + e.montant, 0);
    const tauxUtilisation = montantFinance > 0 ? (financementUtilise / montantFinance) * 100 : 0;

    const caCumulMois = bovins
      .filter((b) => b.statut === "VENDU" && b.dateVente && new Date(b.dateVente) <= endOfMonth)
      .reduce((s, b) => s + b.prixVente, 0);
    const coutsCumulMois = bovins
      .filter((b) => b.dateAchat && new Date(b.dateAchat) <= endOfMonth)
      .reduce((s, b) => s + b.prixAchat + b.coutsEngraissement + b.autresCouts, 0);
    const tresorerie = montantFinance - financementUtilise + caCumulMois - coutsCumulMois;

    return {
      mois: m.label,
      bovinsActifs: bovinsActifsMois.length,
      achats: achatsMois.length,
      ventes: ventesMois.length,
      mortalite: mortaliteMois.length,
      valeurCheptel,
      sacsConsommes,
      coutAlimentation,
      ca,
      coutAchat,
      coutEngraissement,
      margeTotale,
      coutAlimParTete,
      margeParTete,
      financementAccorde: montantFinance,
      financementUtilise,
      tresorerie,
      tauxUtilisation,
    };
  });

  const dernier = monthly[monthly.length - 1];
  const caCumul = monthly.reduce((s, m) => s + m.ca, 0);
  const margeCumul = monthly.reduce((s, m) => s + m.margeTotale, 0);
  const ventesCumul = monthly.reduce((s, m) => s + m.ventes, 0);

  const costStructure = {
    achatBovins: monthly.reduce((s, m) => s + m.coutAchat, 0),
    alimentation: monthly.reduce((s, m) => s + m.coutAlimentation, 0),
    engraissement: monthly.reduce((s, m) => s + m.coutEngraissement, 0),
  };

  const rapport: RapportBailleur = {
    kpis: {
      bovinsActifs: dernier?.bovinsActifs ?? 0,
      caCumul,
      margeTotale: margeCumul,
      margeParTete: ventesCumul > 0 ? margeCumul / ventesCumul : 0,
      tauxUtilisation: dernier?.tauxUtilisation ?? 0,
      tresorerie: dernier?.tresorerie ?? 0,
    },
    monthly,
    costStructure,
    alertes: alertes.map(toAlerte),
  };

  return NextResponse.json(rapport);
}
