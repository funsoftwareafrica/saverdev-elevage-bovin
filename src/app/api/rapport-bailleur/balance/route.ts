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
  "213100": "Logiciels",
  "213200": "Sites internets",
  "234100": "Installations complexes spécialisées sur sol propre",
  "234300": "Installations à caractère spécifique sur sol propre",
  "244100": "Matériel de bureau",
  "244200": "Matériel informatique",
  "244400": "Mobilier de bureau",
  "281300": "Amortissements des logiciels et sites internet",
  "283400": "Amortissements des aménagements et installations techniques",
  "284400": "Amortissements du matériel et mobilier",
  "284500": "Amortissements du matériel de transport",
  // Classe 3 — Stocks
  "311100": "Marchandises A1 (cheptel)",
  "321000":  "Matières A",
  "373800": "Autres stocks (activités annexes)",
  // Classe 4 — Tiers
  "411100": "Clients",
  // Classe 5 — Trésorerie
  "571100": "Caisse / Banque",
  // Classe 6 — Charges
  "601100": "Achats de marchandises dans la Région (cheptel)",
  "602100": "Achats de matières premières et fournitures liées (aliments)",
  "603100": "Variations des stocks de marchandises",
  "603200": "Variations des stocks de matières premières",
  "603300": "Variations des stocks d'autres approvisionnements",
  "605100": "Fournitures non stockables - Eau",
  "605200": "Fournitures non stockables - Electricité",
  "605300": "Fournitures non stockables - Autres énergies",
  "605600": "Achats de petit matériel et outillage",
  "605700": "Achats d'études et prestations de services",
  "612000":  "Transports sur ventes",
  "614000":  "Transports du personnel",
  "622200": "Locations de bâtiments",
  "622800": "Locations et charges locatives diverses",
  "624800": "Autres entretiens et réparations",
  "632400": "Honoraires des professions règlementées",
  "632700": "Rémunérations des autres prestataires de service",
  "661100": "Appointements salaires et commissions",
  "661500": "Indemnités de maladie versées aux travailleurs",
  "666100": "Rémunération du travail de l'exploitant",
  // Classe 7 — Produits
  "701100": "Ventes de marchandises dans la Région (cheptel)",
  "701200": "Ventes de marchandises hors Région (cheptel)",
  "707800": "Autres produits accessoires",
};

// Ordre d'affichage (plan comptable par classe croissante)
const ORDRE_COMPTES = Object.keys(LIBELLES_COMPTE);

// Mapping catégorie dépense → n° de compte SAVERDEV
const CATEGORIE_VERS_COMPTE: Record<string, string> = {
  "Alimentation": "602100",
  "Salaires": "661100",
  "Transport": "612000",
  "Matériel": "605600",
  "Gestion de l'eau": "605100",
  "Santé": "624800",
  "Loyer": "622200",
  "Communication": "632700",
  "Événement": "605700",
  "Immobilisation": "234100",
  "Autres": "624800",
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
        { numCompte: "601100", libelle, debit: montant, credit: 0 },
        { numCompte: "571100", libelle, debit: 0, credit: montant },
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
        { numCompte: "411100", libelle, debit: montant, credit: 0 },
        { numCompte: "701100", libelle, debit: 0, credit: montant },
      ];
    });
  } catch { return []; }
}

// Helper: journal des dépenses (mapping catégorie → compte SAVERDEV)
async function getDepenses(): Promise<JournalEntrySimple[]> {
  try {
    const depenses = await db.depense.findMany({ orderBy: { date: "desc" } });
    return depenses.flatMap((d) => {
      const numCompte = CATEGORIE_VERS_COMPTE[d.categorie] ?? "624800";
      return [
        { numCompte, libelle: d.libelle, debit: d.montant, credit: 0 },
        { numCompte: "571100", libelle: d.libelle, debit: 0, credit: d.montant },
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
        const numCompte = variation >= 0 ? "603100" : "603200";
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
