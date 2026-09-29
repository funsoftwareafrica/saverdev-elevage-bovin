// Calculs purs — réutilisables côté serveur (API) et client (vues).
// Aucune dépendance à React ou aux données mockées.

import type {
  Bovin,
  Alimentation,
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

/** Calcule le tableau de bord agrégé à partir de données brutes. */
export function computeDashboardFromData(data: {
  bovins: Bovin[];
  alimentations: Alimentation[];
  financement: Financement;
  alertes: Alerte[];
}): Dashboard {
  const { bovins, alimentations, financement, alertes } = data;

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

  // Évolution mensuelle (simulée sur 8 mois 2025)
  const evolutionMensuelle = [
    { mois: "Fév", ca: 0, couts: 645000, marge: -645000 },
    { mois: "Mar", ca: 0, couts: 808000, marge: -808000 },
    { mois: "Avr", ca: 0, couts: 840000, marge: -840000 },
    { mois: "Mai", ca: 620000, couts: 738000, marge: -118000 },
    { mois: "Juin", ca: 1155000, couts: 385000, marge: 770000 },
    { mois: "Juil", ca: 540000, couts: 875000, marge: -335000 },
    { mois: "Août", ca: 0, couts: 690000, marge: -690000 },
    { mois: "Sep", ca: 0, couts: 0, marge: 0 },
  ];

  const ventesParMois = [
    { mois: "Fév", ventes: 0, nbTetes: 0 },
    { mois: "Mar", ventes: 0, nbTetes: 0 },
    { mois: "Avr", ventes: 0, nbTetes: 0 },
    { mois: "Mai", ventes: 620000, nbTetes: 1 },
    { mois: "Juin", ventes: 1155000, nbTetes: 2 },
    { mois: "Juil", ventes: 540000, nbTetes: 1 },
    { mois: "Août", ventes: 0, nbTetes: 0 },
  ];

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
