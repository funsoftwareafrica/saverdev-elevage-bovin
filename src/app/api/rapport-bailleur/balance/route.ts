// GET /api/rapport-bailleur/balance — balance comptable groupée par compte.
//
// Colonnes retournées pour chaque compte :
//   - solde N-1 (débit / crédit) — figé à 0 (pas d'historique antérieur stocké)
//   - mouvements N (débit / crédit) — agrégation des journaux achat/vente/dépense
//   - solde N (débit / crédit) — mvt débit − mvt crédit
//
// Reprend la logique qui était dans `/api/saisie?type=balance` (avant la Task 29).
// La balance appartient désormais au rapport bailleur, pas à la vue Saisie.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { BalanceComptable, BalanceLigne } from "@/lib/types";

// Libellés des comptes du plan comptable SAVERDEV (cf. cahier des charges §6).
const LIBELLES_COMPTE: Record<string, string> = {
  "23": "Immobilisations",
  "4111": "Clients",
  "5711": "Caisse / Banque",
  "6011": "Achats de bétail",
  "6012": "Achats d'aliments",
  "615": "Vétérinaire",
  "624": "Transport",
  "661": "Salariat",
  "68": "Autres charges",
  "7011": "Ventes de bétail",
};

// Ordre d'affichage des comptes dans la balance (plan comptable SAVERDEV).
const ORDRE_COMPTES = [
  "23", "4111", "5711",
  "6011", "6012", "615", "624", "661", "68",
  "7011",
];

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
  } catch (e) {
    console.error("balance.getAchats:", e);
    return [];
  }
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
  } catch (e) {
    console.error("balance.getVentes:", e);
    return [];
  }
}

// Helper: journal de dépenses (compte 6xxx débit / 5711 crédit)
async function getDepenses(): Promise<JournalEntrySimple[]> {
  try {
    const depenses = await db.depense.findMany({ orderBy: { date: "desc" } });
    return depenses.flatMap((d) => {
      const numCompte =
        d.categorie === "Vétérinaire" ? "615"
        : d.categorie === "Salariat" ? "661"
        : d.categorie === "Immobilisation" ? "23"
        : d.categorie === "Transport" ? "624"
        : d.categorie === "Aliment bétail" ? "6012"
        : "68";
      return [
        { numCompte, libelle: d.libelle, debit: d.montant, credit: 0 },
        { numCompte: "5711", libelle: d.libelle, debit: 0, credit: d.montant },
      ];
    });
  } catch (e) {
    console.error("balance.getDepenses:", e);
    return [];
  }
}

export async function GET() {
  const [achats, ventes, depenses] = await Promise.all([
    getAchats(),
    getVentes(),
    getDepenses(),
  ]);
  const allEntries = [...achats, ...ventes, ...depenses];

  // Regrouper par numéro de compte
  const parCompte: Record<string, { totalDebit: number; totalCredit: number }> = {};
  for (const e of allEntries) {
    if (!parCompte[e.numCompte]) {
      parCompte[e.numCompte] = { totalDebit: 0, totalCredit: 0 };
    }
    parCompte[e.numCompte].totalDebit += e.debit;
    parCompte[e.numCompte].totalCredit += e.credit;
  }

  // Construire les lignes dans l'ordre du plan comptable
  const lignes: BalanceLigne[] = ORDRE_COMPTES.map((numCompte) => {
    const agg = parCompte[numCompte] ?? { totalDebit: 0, totalCredit: 0 };
    const solde = agg.totalDebit - agg.totalCredit;
    const soldeDebit = solde > 0 ? Math.abs(solde) : 0;
    const soldeCredit = solde < 0 ? Math.abs(solde) : 0;
    return {
      numCompte,
      libelle: LIBELLES_COMPTE[numCompte] ?? "",
      soldeN1Debit: 0,   // N-1 figé : pas d'historique antérieur stocké
      soldeN1Credit: 0,
      mvtNDebit: agg.totalDebit,
      mvtNCredit: agg.totalCredit,
      soldeNDebit: soldeDebit,
      soldeNCredit: soldeCredit,
    };
  });

  const totalDebitGeneral = lignes.reduce((s, l) => s + l.mvtNDebit, 0);
  const totalCreditGeneral = lignes.reduce((s, l) => s + l.mvtNCredit, 0);
  const soldeDebitGeneral = lignes.reduce((s, l) => s + l.soldeNDebit, 0);
  const soldeCreditGeneral = lignes.reduce((s, l) => s + l.soldeNCredit, 0);

  const balance: BalanceComptable = {
    lignes,
    totalDebitGeneral,
    totalCreditGeneral,
    soldeDebitGeneral,
    soldeCreditGeneral,
  };

  return NextResponse.json(balance);
}
