// Types partagés de l'application Élevage Bovin (SAVERDEV)
// Conçus pour matcher le schéma Prisma + besoins UI.

export type Role = "ELEVEUR" | "GERANT" | "BAILLEUR" | "ADMIN";

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
  ELEVEUR: "Éleveur",
  GERANT: "Gérant",
  BAILLEUR: "Bailleur",
  ADMIN: "Administrateur",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ELEVEUR: "Saisie et consultation des opérations quotidiennes",
  GERANT: "Saisie, validation, pilotage, reporting et administration",
  BAILLEUR: "Consultation des tableaux de bord et rapports (lecture seule)",
  ADMIN: "Administration technique et supervision",
};

// Vues accessibles par rôle
export const ROLE_VIEWS: Record<Role, ViewKey[]> = {
  ELEVEUR: ["dashboard", "bovins", "fiche-bovin", "alimentation", "depenses", "ventes", "pesees"],
  GERANT: ["dashboard", "bovins", "fiche-bovin", "alimentation", "depenses", "ventes", "rentabilite", "financement", "rapport", "tresorerie", "pesees", "parametres", "paturages"],
  BAILLEUR: ["bailleur-synthese", "financement", "rapport"],
  ADMIN: ["dashboard", "bovins", "fiche-bovin", "alimentation", "depenses", "ventes", "rentabilite", "financement", "rapport", "tresorerie", "pesees", "parametres", "paturages"],
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
  | "bailleur-synthese";

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
