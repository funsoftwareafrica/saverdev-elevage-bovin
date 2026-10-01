// Types partagés (identiques au web)
export type Role = "ELEVEUR" | "GERANT" | "BAILLEUR" | "ADMIN";
export type StatutBovin = "EN_ENGRAISSEMENT" | "VENDU" | "MORT";

export interface Bovin {
  id: string; identifiant: string; race: string; sexe: string;
  dateAchat: string; prixAchat: number; poidsAchat: number;
  statut: StatutBovin; dateVente: string | null; prixVente: number;
  coutsEngraissement: number; autresCouts: number; clientVente: string | null;
}

export interface Dashboard {
  cheptel: { bovinsActifs: number; bovinsVendus: number; mortalite: number; valeurCheptel: number; };
  engraissement: { dureeMoyenneJours: number; nbEnCycle: number; poidsMoyen: number; };
  alimentation: { nbSacs: number; coutTotal: number; coutParTete: number; };
  rentabilite: { ca: number; coutAchat: number; coutEngraissement: number; margeParTete: number; margeTotale: number; };
  financement: { montantFinance: number; montantUtilise: number; solde: number; echeancesPayees: number; echeancesAPayer: number; echeancesEnRetard: number; tauxUtilisation: number; };
  alertes: { id: string; date: string; type: string; severite: string; message: string; resolved: boolean }[];
}

export const ROLE_LABELS: Record<Role, string> = {
  ELEVEUR: "Éleveur", GERANT: "Gérant", BAILLEUR: "Bailleur", ADMIN: "Admin",
};
