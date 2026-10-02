// Calculs purs — réutilisables côté serveur (API) et client (vues).
// Aucune dépendance à React ou aux données mockées.

import type {
  Bovin,
  Alimentation,
  Depense,
  Financement,
  Alerte,
  Dashboard,
} from "@/lib/types";

/** Coût de revient et marge d'un bovin. */
export function computeBovinMarge(b: Bovin): { coutRevient: number; marge: number | null } {
  const coutRevient = b.prixAchat + b.coutsEngraissement + b.autresCouts;
  const marge = b.statut === "VENDU" ? b.prixVente - coutRevient : null;
  return { coutRevient, marge };
}

/** Retourne la clé mois "YYYY-MM" d'une date ISO. */
function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Construit la liste des mois couvrant la période où il y a des données.
 *  Trouve la 1ère et la dernière date de données, génère les mois intermédiaires.
 *  Garantit min 6 mois ; limite à maxMonths (on garde les plus récents). */
function dataMonths(
  dates: string[],
  minMonths = 6,
  maxMonths = 18
): { key: string; label: string }[] {
  const now = new Date();
  let earliest: Date | null = null;
  let latest: Date | null = null;
  for (const iso of dates) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) continue;
    if (!earliest || d < earliest) earliest = d;
    if (!latest || d > latest) latest = d;
  }
  // Si aucune date de données → derniers minMonths mois jusqu'à maintenant
  if (!earliest || !latest) {
    const out: { key: string; label: string }[] = [];
    for (let i = minMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
      });
    }
    return out;
  }

  const start = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  const end = new Date(Math.max(latest.getTime(), now.getTime()));
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  const all: { key: string; label: string }[] = [];
  const cur = new Date(start);
  while (cur <= endMonth) {
    all.push({
      key: `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`,
      label: cur.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
    });
    cur.setMonth(cur.getMonth() + 1);
  }
  // Si trop de mois, on garde les plus récents (maxMonths)
  if (all.length > maxMonths) return all.slice(all.length - maxMonths);
  // Si pas assez de mois, on complète par le passé
  while (all.length < minMonths) {
    const first = all[0];
    const [y, m] = first.key.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    all.unshift({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
    });
  }
  return all;
}

/** Calcule le tableau de bord agrégé à partir de données brutes. */
export function computeDashboardFromData(data: {
  bovins: Bovin[];
  alimentations: Alimentation[];
  depenses?: Depense[];
  financement: Financement;
  alertes: Alerte[];
}): Dashboard {
  const { bovins, alimentations, depenses = [], financement, alertes } = data;

  const actifs = bovins.filter((b) => b.statut === "EN_ENGRAISSEMENT");
  const vendus = bovins.filter((b) => b.statut === "VENDU");
  const morts = bovins.filter((b) => b.statut === "MORT");

  // Rentabilité
  const ca = vendus.reduce((s, b) => s + b.prixVente, 0);
  const coutAchat = vendus.reduce((s, b) => s + b.prixAchat, 0);
  const coutEngrais = vendus.reduce((s, b) => s + b.coutsEngraissement + b.autresCouts, 0);
  const margeTotale = vendus.reduce(
    (s, b) => s + (b.prixVente - b.prixAchat - b.coutsEngraissement - b.autresCouts),
    0
  );
  const margeParTete = vendus.length ? margeTotale / vendus.length : 0;

  // Alimentation
  const nbSacs = alimentations.reduce((s, a) => s + a.quantite, 0);
  const coutAlimTotal = alimentations.reduce((s, a) => s + a.coutTotal, 0);
  const coutAlimParTete = bovins.length ? coutAlimTotal / (actifs.length + vendus.length) : 0;

  // Valeur du cheptel
  const valeurCheptel = actifs.reduce((s, b) => s + b.prixAchat + b.coutsEngraissement, 0);

  // Engraissement : durée moyenne
  const durees = vendus.map((b) => {
    if (!b.dateVente) return 0;
    return Math.round(
      (new Date(b.dateVente).getTime() - new Date(b.dateAchat).getTime()) / (1000 * 60 * 60 * 24)
    );
  });
  const dureeMoyenne = durees.length ? durees.reduce((s, d) => s + d, 0) / durees.length : 0;

  // Financement
  const echeances = financement.echeances;
  const payees = echeances.filter((e) => e.statut === "PAYEE");
  const aPayer = echeances.filter((e) => e.statut === "A_PAYER");
  const enRetard = echeances.filter((e) => e.statut === "EN_RETARD");
  const montantUtilise = payees.reduce((s, e) => s + e.montant, 0);
  const tauxUtilisation = (montantUtilise / financement.montantFinance) * 100;

  // === Évolution mensuelle RÉELLE ===
  // CA mensuel = somme des ventes (prixVente) des bovins vendus ce mois
  // Coûts mensuels = achats de bovins (prixAchat) + alimentations (coutTotal) + dépenses (montant)
  // Marge = CA - Coûts
  // La fenêtre couvre la période réelle des données (min 6, max 12 mois)
  const allDates: string[] = [
    ...bovins.map((b) => b.dateAchat),
    ...vendus.map((b) => b.dateVente).filter(Boolean) as string[],
    ...alimentations.map((a) => a.date),
    ...depenses.map((d) => d.date),
  ];
  const months = dataMonths(allDates);

  const evolutionMensuelle = months.map((m) => {
    const caMois = vendus
      .filter((b) => b.dateVente && monthKey(b.dateVente) === m.key)
      .reduce((s, b) => s + b.prixVente, 0);

    const coutAchatMois = bovins
      .filter((b) => monthKey(b.dateAchat) === m.key)
      .reduce((s, b) => s + b.prixAchat, 0);

    const coutAlimMois = alimentations
      .filter((a) => monthKey(a.date) === m.key)
      .reduce((s, a) => s + a.coutTotal, 0);

    const coutDepMois = depenses
      .filter((d) => monthKey(d.date) === m.key)
      .reduce((s, d) => s + d.montant, 0);

    const couts = coutAchatMois + coutAlimMois + coutDepMois;
    const marge = caMois - couts;

    return { mois: m.label, ca: caMois, couts, marge };
  });

  // === Ventes par mois RÉELLES ===
  const ventesParMois = months.map((m) => {
    const bovinsVendusMois = vendus.filter(
      (b) => b.dateVente && monthKey(b.dateVente) === m.key
    );
    return {
      mois: m.label,
      ventes: bovinsVendusMois.reduce((s, b) => s + b.prixVente, 0),
      nbTetes: bovinsVendusMois.length,
    };
  });

  return {
    cheptel: {
      bovinsActifs: actifs.length,
      bovinsVendus: vendus.length,
      entreesMois: 1,
      sortiesMois: 1,
      mortalite: morts.length,
      valeurCheptel,
    },
    engraissement: {
      dureeMoyenneJours: Math.round(dureeMoyenne),
      nbEnCycle: actifs.length,
      poidsMoyen: Math.round(
        actifs.reduce((s, b) => s + b.poidsAchat, 0) / Math.max(1, actifs.length)
      ),
    },
    alimentation: {
      nbSacs,
      coutTotal: coutAlimTotal,
      coutParTete: coutAlimParTete,
    },
    rentabilite: {
      ca,
      coutAchat,
      coutEngraissement: coutEngrais,
      margeParTete,
      margeTotale,
    },
    financement: {
      montantFinance: financement.montantFinance,
      montantUtilise,
      solde: financement.montantFinance - montantUtilise,
      echeancesPayees: payees.length,
      echeancesAPayer: aPayer.length,
      echeancesEnRetard: enRetard.length,
      tauxUtilisation,
    },
    alertes,
    evolutionMensuelle,
    ventesParMois,
  };
}
