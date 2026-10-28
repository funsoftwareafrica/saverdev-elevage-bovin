// GET /api/rapport-bailleur/balance — balance comptable SAVERDEV (plan comptable officiel)
//
// Utilise le PLAN COMPTA SAVERDEV complet. Seuls les comptes ayant des
// mouvements sont affichés (les comptes à 0 sont filtrés).
//
// Colonnes : Solde N-1 (0, pas d'historique) / Mouvements N (débit/crédit) / Solde N

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { BalanceComptable, BalanceLigne } from "@/lib/types";

// ---- PLAN COMPTA SAVERDEV (extrait du PDF "PLAN COMPTA SAVERDEV.pdf") ----
const LIBELLES_COMPTE: Record<string, string> = {
  // Classe 2 — Immobilisations
  "2131": "Logiciels",
  "2132": "Sites internets",
  "2341": "Installations complexes spécialisées sur sol propre",
  "2343": "Installations à caractère spécifique sur sol propre",
  "2441": "Matériel de bureau",
  "2442": "Matériel informatique",
  "2444": "Mobilier de bureau",
  "2813": "Amortissements des logiciels et sites internet",
  "2834": "Amortissements des aménagements et installations techniques",
  "2844": "Amortissements du matériel et mobilier",
  "2845": "Amortissements du matériel de transport",
  // Classe 3 — Stocks
  "3111": "Marchandises A1 (cheptel)",
  "321":  "Matières A",
  "3738": "Autres stocks (activités annexes)",
  // Classe 4 — Tiers
  "4111": "Clients",
  // Classe 5 — Trésorerie
  "5711": "Caisse / Banque",
  // Classe 6 — Charges
  "6011": "Achats de marchandises dans la Région (cheptel)",
  "6021": "Achats de matières premières et fournitures liées (aliments)",
  "6031": "Variations des stocks de marchandises",
  "6032": "Variations des stocks de matières premières",
  "6033": "Variations des stocks d'autres approvisionnements",
  "6051": "Fournitures non stockables - Eau",
  "6052": "Fournitures non stockables - Electricité",
  "6053": "Fournitures non stockables - Autres énergies",
  "6056": "Achats de petit matériel et outillage",
  "6057": "Achats d'études et prestations de services",
  "612":  "Transports sur ventes",
  "614":  "Transports du personnel",
  "6222": "Locations de bâtiments",
  "6228": "Locations et charges locatives diverses",
  "6248": "Autres entretiens et réparations",
  "6324": "Honoraires des professions règlementées",
  "6327": "Rémunérations des autres prestataires de service",
  "6611": "Appointements salaires et commissions",
  "6615": "Indemnités de maladie versées aux travailleurs",
  "6661": "Rémunération du travail de l'exploitant",
  // Classe 7 — Produits
  "7011": "Ventes de marchandises dans la Région (cheptel)",
  "7012": "Ventes de marchandises hors Région (cheptel)",
  "7078": "Autres produits accessoires",
};

// Ordre d'affichage (plan comptable par classe croissante)
const ORDRE_COMPTES = Object.keys(LIBELLES_COMPTE);

// Mapping catégorie dépense → n° de compte SAVERDEV
const CATEGORIE_VERS_COMPTE: Record<string, string> = {
  "Alimentation": "6021",
  "Salaires": "6611",
  "Transport": "612",
  "Matériel": "6056",
  "Gestion de l'eau": "6051",
  "Santé": "6248",
  "Loyer": "6222",
  "Communication": "6327",
  "Événement": "6057",
  "Immobilisation": "2341",
  "Autres": "6248",
};

interface JournalEntrySimple {
  numCompte: string;
  libelle: string;
  debit: number;
  credit: number;
}

// Helper: journal d'achat (compte 6011 débit / 5711 crédit)
async function getAchats(): Promise<JournalEntrySimple[]> {
  try {
    const bovins = await db.bovin.findMany({ orderBy: { dateAchat: "desc" } });
    return bovins.flatMap((b) => {
      const montant = b.prixAchat;
      const libelle = `${b.identifiant} — ${b.race}`;
      return [
        { numCompte: "6011", libelle, debit: montant, credit: 0 },
        { numCompte: "5711", libelle, debit: 0, credit: montant },
      ];
    });
  } catch { return []; }
}

// Helper: journal de vente (compte 4111 débit / 7011 crédit)
async function getVentes(): Promise<JournalEntrySimple[]> {
  try {
    const vendus = await db.bovin.findMany({
      where: { statut: "VENDU" },
      orderBy: { dateVente: "desc" },
    });
    return vendus.filter((b) => b.dateVente).flatMap((b) => {
      const montant = b.prixVente;
      const libelle = `${b.identifiant} — ${b.clientVente ?? "Client"}`;
      return [
        { numCompte: "4111", libelle, debit: montant, credit: 0 },
        { numCompte: "7011", libelle, debit: 0, credit: montant },
      ];
    });
  } catch { return []; }
}

// Helper: journal des dépenses (mapping catégorie → compte SAVERDEV)
async function getDepenses(): Promise<JournalEntrySimple[]> {
  try {
    const depenses = await db.depense.findMany({ orderBy: { date: "desc" } });
    return depenses.flatMap((d) => {
      const numCompte = CATEGORIE_VERS_COMPTE[d.categorie] ?? "6248";
      return [
        { numCompte, libelle: d.libelle, debit: d.montant, credit: 0 },
        { numCompte: "5711", libelle: d.libelle, debit: 0, credit: d.montant },
      ];
    });
  } catch { return []; }
}

// Helper: variations de stocks (compte 6031/6032/6033)
async function getVariationStocks(): Promise<JournalEntrySimple[]> {
  try {
    const mouvements = await db.stockMouvement.findMany();
    // Pour chaque type d'aliment, calculer entrées - sorties
    const parType: Record<string, { entree: number; sortie: number; valeur: number }> = {};
    for (const m of mouvements) {
      if (!parType[m.typeAliment]) parType[m.typeAliment] = { entree: 0, sortie: 0, valeur: 0 };
      parType[m.typeAliment].entree += m.entree;
      parType[m.typeAliment].sortie += m.sortie;
      parType[m.typeAliment].valeur += (m.entree - m.sortie) * m.prixParSac;
    }
    const entries: JournalEntrySimple[] = [];
    for (const [type, data] of Object.entries(parType)) {
      const variation = data.entree - data.sortie;
      const valeur = Math.abs(data.valeur);
      if (valeur > 0) {
        const numCompte = variation >= 0 ? "6031" : "6032";
        entries.push({
          numCompte,
          libelle: `Variation stock ${type}`,
          debit: variation < 0 ? valeur : 0,
          credit: variation >= 0 ? valeur : 0,
        });
      }
    }
    return entries;
  } catch { return []; }
}

export async function GET() {
  const [achats, ventes, depenses, variationsStock] = await Promise.all([
    getAchats(),
    getVentes(),
    getDepenses(),
    getVariationStocks(),
  ]);

  const allEntries = [...achats, ...ventes, ...depenses, ...variationsStock];

  // Regrouper par numéro de compte
  const parCompte: Record<string, { numCompte: string; libelle: string; totalDebit: number; totalCredit: number; solde: number; conclusion: string }> = {};
  for (const e of allEntries) {
    if (!parCompte[e.numCompte]) {
      parCompte[e.numCompte] = {
        numCompte: e.numCompte,
        libelle: LIBELLES_COMPTE[e.numCompte] ?? e.libelle.split(" — ")[0] ?? "Inconnu",
        totalDebit: 0, totalCredit: 0, solde: 0, conclusion: "",
      };
    }
    parCompte[e.numCompte].totalDebit += e.debit;
    parCompte[e.numCompte].totalCredit += e.credit;
  }

  // Filtrer : ne garder QUE les comptes qui ont des mouvements (non-zéro)
  const balance: BalanceLigne[] = ORDRE_COMPTES
    .filter((num) => parCompte[num] && (parCompte[num].totalDebit > 0 || parCompte[num].totalCredit > 0))
    .map((num) => {
      const c = parCompte[num];
      c.solde = c.totalDebit - c.totalCredit;
      c.conclusion = c.solde > 0 ? "Débitaire" : c.solde < 0 ? "Créditaire" : "Soldé";
      return c;
    });

  const totalDebitGeneral = balance.reduce((s, c) => s + c.totalDebit, 0);
  const totalCreditGeneral = balance.reduce((s, c) => s + c.totalCredit, 0);
  const soldeGeneral = totalDebitGeneral - totalCreditGeneral;

  const result: BalanceComptable = {
    lignes: balance,
    totalDebitGeneral,
    totalCreditGeneral,
    soldeGeneral,
    conclusionGeneral: soldeGeneral > 0 ? "Solde général débitaire" : soldeGeneral < 0 ? "Solde général créditaire" : "Solde équilibré",
  };

  return NextResponse.json(result);
}
