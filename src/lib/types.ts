// Types partagés de l'application Élevage Bovin (SAVERDEV)
// Conçus pour matcher le schéma Prisma + besoins UI.

export type Role = "BENEFICIAIRE" | "SINERGI" | "E2A";

export type StatutBovin = "EN_ENGRAISSEMENT" | "VENDU" | "MORT";

export type StatutEcheance = "PAYEE" | "A_PAYER" | "EN_RETARD";

export interface Bovin {
  id: string;
  identifiant: string;
  race: string;
  sexe: string;
  dateAchat: string; // ISO
  prixAchat: number;
  poidsAchat: number;
  statut: StatutBovin;
  dateVente: string | null;
  prixVente: number;
  coutsEngraissement: number; // cumul auto
  autresCouts: number;
  clientVente: string | null;
  // dérivés (calculés côté UI/API)
  coutRevient?: number;
  marge?: number | null;
}

export interface Alimentation {
  id: string;
  date: string;
  produit: string;
  quantite: number;
  unite: string;
  coutTotal: number;
  nbBovinsConcernes: number;
  coutParTete: number;
  commentaire: string | null;
}

export interface Depense {
  id: string;
  date: string;
  categorie: string;
  libelle: string;
  montant: number;
  nbBovinsConcernes: number;
}

export interface Financement {
  id: string;
  bailleur: string;
  montantFinance: number;
  dateOctroi: string;
  tauxInteret: number;
  dureeMois: number;
  echeances: Echeance[];
}

export interface Echeance {
  id: string;
  numero: number;
  datePrevue: string;
  montant: number;
  statut: StatutEcheance;
  datePayee: string | null;
}

export interface Alerte {
  id: string;
  date: string;
  type: string; // ECHEANCE | BUDGET | MORTALITE | MARGE | AUTRE
  severite: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  resolved: boolean;
}

export interface Historique {
  id: string;
  date: string;
  action: string;
  entiteType: string;
  entiteId: string | null;
  details: string | null;
  user?: { name: string } | null;
}

// ---------- Agrégats pour tableaux de bord ----------

export interface KpiCheptel {
  bovinsActifs: number;
  bovinsVendus: number;
  entreesMois: number;
  sortiesMois: number;
  mortalite: number;
  valeurCheptel: number; // estimation
}

export interface KpiEngraissement {
  dureeMoyenneJours: number;
  nbEnCycle: number;
  poidsMoyen: number;
}

export interface KpiAlimentation {
  nbSacs: number;
  coutTotal: number;
  coutParTete: number;
}

export interface KpiRentabilite {
  ca: number;
  coutAchat: number;
  coutEngraissement: number;
  margeParTete: number;
  margeTotale: number;
}

export interface KpiFinancement {
  montantFinance: number;
  montantUtilise: number;
  solde: number;
  echeancesPayees: number;
  echeancesAPayer: number;
  echeancesEnRetard: number;
  tauxUtilisation: number;
}

export interface Dashboard {
  cheptel: KpiCheptel;
  engraissement: KpiEngraissement;
  alimentation: KpiAlimentation;
  rentabilite: KpiRentabilite;
  financement: KpiFinancement;
  alertes: Alerte[];
  evolutionMensuelle: { mois: string; ca: number; couts: number; marge: number }[];
  ventesParMois: { mois: string; ventes: number; nbTetes: number }[];
}

// ---------- Rôles & permissions ----------

export const ROLE_LABELS: Record<Role, string> = {
  BENEFICIAIRE: "Bénéficiaire",
  SINERGI: "SINERGI SA",
  E2A: "E2A",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  BENEFICIAIRE: "Saisie, consultation, pilotage et gestion complète",
  SINERGI: "Consultation des tableaux de bord et rapports (lecture seule)",
  E2A: "Administration technique et supervision",
};

// Vues accessibles par rôle
export const ROLE_VIEWS: Record<Role, ViewKey[]> = {
  BENEFICIAIRE: ["carte-3d","dashboard","saisie","bovins","fiche-bovin","alimentation","depenses","ventes","rentabilite","financement","rapport","tresorerie","pesees","parametres","paturages"],
  SINERGI: ["dashboard","rentabilite","financement","rapport"],
  E2A: ["carte-3d","dashboard","saisie","bovins","fiche-bovin","alimentation","depenses","ventes","rentabilite","financement","rapport","tresorerie","pesees","parametres","paturages"],
};

export type ViewKey =
  | "dashboard"
  | "bovins"
  | "fiche-bovin"
  | "alimentation"
  | "depenses"
  | "ventes"
  | "rentabilite"
  | "financement"
  | "rapport"
  | "tresorerie"
  | "pesees"
  | "parametres"
  | "paturages"
  | "bailleur-synthese"
  | "carte-3d"
  | "saisie";

export interface Pese { id: string; bovinId: string; identifiant: string; race: string; date: string; poids: number; methode: string; }
export interface Parametre { id: string; cle: string; valeur: string; description: string | null; }
export interface NotificationItem { id: string; date: string; type: string; titre: string; message: string; lu: boolean; lien: string | null; }
export interface TresorerieProjection { mois: string; date: string; entrees: number; sorties: number; solde: number; soldeCumule: number; enRisque: boolean; }
export interface Tresorerie { soldeInitial: number; depenseMensuelleMoy: number; projection: TresorerieProjection[]; moisARisque: number; totalEntrees: number; totalSorties: number; }
export interface Backup { id: string; date: string; filename: string; size: number; type: string; entities: number; }
export interface Soin { id: string; bovinId: string; date: string; type: string; libelle: string; cout: number; prochainRappel: string | null; notes: string | null; }
export interface RaceStat { race: string; total: number; actifs: number; vendus: number; margeTotale: number; margeMoyenne: number; dureeMoyenne: number; poidsMoyen: number; }
export interface ComparaisonMois { moisCourant: string; moisPrecedent: string; ventes: { courant: number; prec: number; delta: { abs: number; pct: number } }; ca: { courant: number; prec: number; delta: { abs: number; pct: number } }; marge: { courant: number; prec: number; delta: { abs: number; pct: number } }; depenses: { courant: number; prec: number; delta: { abs: number; pct: number } }; alimentation: { courant: number; prec: number; delta: { abs: number; pct: number } }; }
export interface Paturage { id: string; nom: string; surface: number; coordonnees: string | null; capacite: number; createdAt: string; }

export interface Tag { id: string; tag: string; color: string; }
export interface Validation { id: string; entiteType: string; entiteId: string; action: string; statut: string; dateSaisie: string; dateValidation: string | null; commentaire: string | null; }

// ---------- Rapport Bailleur (modèle Excel E2A) ----------

/** Ligne mensuelle — correspond à une ligne de la feuille "Données" du modèle Excel. */
export interface RapportMensuel {
  mois: string;
  bovinsActifs: number;        // B — bovins actifs (fin de mois)
  achats: number;              // C — têtes achetées dans le mois
  ventes: number;              // D — têtes vendues dans le mois
  mortalite: number;           // E — têtes perdues
  valeurCheptel: number;       // F — estimation (achat + engrais. des actifs)
  sacsConsommes: number;       // G — sacs consommés dans le mois
  coutAlimentation: number;    // H — coût alimentation du mois
  ca: number;                  // I — chiffre d'affaires du mois
  coutAchat: number;            // J — coût d'achat des bovins vendus
  coutEngraissement: number;   // K — coût engraissement des bovins vendus
  margeTotale: number;         // L — I - J - K
  coutAlimParTete: number;     // M — H / B
  margeParTete: number;        // N — L / D
  financementAccorde: number;  // O — capital total accordé
  financementUtilise: number;  // P — utilisé cumul
  tresorerie: number;           // Q — trésorerie disponible
  tauxUtilisation: number;      // R — P / O
}

/** Structure des coûts cumulés (pour le doughnut). */
export interface StructureCouts {
  achatBovins: number;     // somme J
  alimentation: number;    // somme H
  engraissement: number;   // somme K
}

/** Synthèse pour le rapport bailleur — KPIs + données mensuelles + structure. */
export interface RapportBailleur {
  kpis: {
    bovinsActifs: number;
    caCumul: number;
    margeTotale: number;
    margeParTete: number;
    tauxUtilisation: number;
    tresorerie: number;
  };
  monthly: RapportMensuel[];
  costStructure: StructureCouts;
  alertes: Alerte[];
}

