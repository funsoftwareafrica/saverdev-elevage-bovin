// Helpers serveur — conversion Prisma → interfaces TypeScript partagées.
// Prisma renvoie des Date ; le client attend des string ISO.

import type {
  Bovin,
  Alimentation,
  Depense,
  Financement,
  Echeance,
  Alerte,
  Historique,
  StatutBovin,
  StatutEcheance,
} from "@/lib/types";

import type {
  Bovin as PrismaBovin,
  Alimentation as PrismaAlimentation,
  Depense as PrismaDepense,
  Financement as PrismaFinancement,
  Echeance as PrismaEcheance,
  Alerte as PrismaAlerte,
  Historique as PrismaHistorique,
} from "@prisma/client";

export function toBovin(b: PrismaBovin): Bovin {
  return {
    id: b.id,
    identifiant: b.identifiant,
    espece: b.espece,
    gestionnaire: b.gestionnaire,
    race: b.race,
    sexe: b.sexe,
    dateAchat: b.dateAchat.toISOString(),
    prixAchat: b.prixAchat,
    poidsAchat: b.poidsAchat,
    statut: b.statut as StatutBovin,
    dateVente: b.dateVente ? b.dateVente.toISOString() : null,
    prixVente: b.prixVente,
    coutsEngraissement: b.coutsEngraissement,
    autresCouts: b.autresCouts,
    clientVente: b.clientVente,
  };
}

export function toAlimentation(a: PrismaAlimentation): Alimentation {
  return {
    id: a.id,
    date: a.date.toISOString(),
    produit: a.produit,
    quantite: a.quantite,
    unite: a.unite,
    coutTotal: a.coutTotal,
    nbBovinsConcernes: a.nbBovinsConcernes,
    coutParTete: a.coutParTete,
    commentaire: a.commentaire,
  };
}

export function toDepense(d: PrismaDepense): Depense {
  return {
    id: d.id,
    date: d.date.toISOString(),
    categorie: d.categorie,
    libelle: d.libelle,
    montant: d.montant,
    nbBovinsConcernes: d.nbBovinsConcernes,
  };
}

export function toEcheance(e: PrismaEcheance): Echeance {
  return {
    id: e.id,
    numero: e.numero,
    datePrevue: e.datePrevue.toISOString(),
    montant: e.montant,
    statut: e.statut as StatutEcheance,
    datePayee: e.datePayee ? e.datePayee.toISOString() : null,
  };
}

export function toFinancement(f: PrismaFinancement & { echeances: PrismaEcheance[] }): Financement {
  return {
    id: f.id,
    bailleur: f.bailleur,
    montantFinance: f.montantFinance,
    dateOctroi: f.dateOctroi.toISOString(),
    tauxInteret: f.tauxInteret,
    dureeMois: f.dureeMois,
    echeances: f.echeances.map(toEcheance).sort((a, b) => a.numero - b.numero),
  };
}

export function toAlerte(a: PrismaAlerte): Alerte {
  return {
    id: a.id,
    date: a.date.toISOString(),
    type: a.type,
    severite: a.severite as "INFO" | "WARNING" | "CRITICAL",
    message: a.message,
    resolved: a.resolved,
  };
}

export function toHistorique(h: PrismaHistorique & { user: { name: string } | null }): Historique {
  return {
    id: h.id,
    date: h.date.toISOString(),
    action: h.action,
    entiteType: h.entiteType,
    entiteId: h.entiteId,
    details: h.details,
    user: h.user ? { name: h.user.name } : null,
  };
}
