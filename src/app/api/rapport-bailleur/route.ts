// GET /api/rapport-bailleur — synthèse mensuelle pour le bailleur (modèle Excel E2A)
// Retourne : KPIs + données mensuelles (12 mois) + structure des coûts + alertes
//            + balance comptable + capital + budget + investissements (Task 29).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toBovin, toFinancement, toAlerte } from "@/lib/server-mappers";
import type {
  RapportMensuel, RapportBailleur,
  BalanceComptable, BalanceLigne,
  CapitalSuivi, CapitalMouvementItem,
  BudgetRapport, BudgetSection, BudgetLigne,
  Investissement,
} from "@/lib/types";

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

// Financement reçu par défaut (utilisé si aucun Parametre "capital_initial" en DB)
const CAPITAL_INITIAL_DEFAUT = 14_775_000;

/** Récupère le financement reçu depuis la table Parametre (statique, immuable
 *  depuis l'UI). Si absent, retourne la valeur par défaut. */
async function getCapitalInitial(): Promise<number> {
  try {
    const param = await db.parametre.findUnique({ where: { cle: "capital_initial" } });
    if (param) {
      const n = Number(param.valeur);
      if (!isNaN(n) && n >= 0) return n;
    }
  } catch (e) {
    console.error("getCapitalInitial:", e);
  }
  return CAPITAL_INITIAL_DEFAUT;
}

/** Formate une date en "JJ/MM/AAAA HH:MM" pour l'affichage horodaté. */
function formatDateTimeFR(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------- Helpers balance comptable ----------
// Libellés + ordre des comptes du plan comptable SAVERDEV.
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
const ORDRE_COMPTES = ["23", "4111", "5711", "6011", "6012", "615", "624", "661", "68", "7011"];

interface JournalEntrySimple { numCompte: string; libelle: string; debit: number; credit: number; }

function numeroCompteDepense(categorie: string): string {
  switch (categorie) {
    case "Vétérinaire": return "615";
    case "Salariat": return "661";
    case "Immobilisation": return "23";
    case "Transport": return "624";
    case "Aliment bétail": return "6012";
    default: return "68";
  }
}

/** Calcule la balance comptable depuis les achats/ventes/dépenses en mémoire. */
function computeBalance(
  achatsEntries: JournalEntrySimple[],
  ventesEntries: JournalEntrySimple[],
  depensesEntries: JournalEntrySimple[],
): BalanceComptable {
  const allEntries = [...achatsEntries, ...ventesEntries, ...depensesEntries];
  const parCompte: Record<string, { totalDebit: number; totalCredit: number }> = {};
  for (const e of allEntries) {
    if (!parCompte[e.numCompte]) parCompte[e.numCompte] = { totalDebit: 0, totalCredit: 0 };
    parCompte[e.numCompte].totalDebit += e.debit;
    parCompte[e.numCompte].totalCredit += e.credit;
  }
  const lignes: BalanceLigne[] = ORDRE_COMPTES.map((numCompte) => {
    const agg = parCompte[numCompte] ?? { totalDebit: 0, totalCredit: 0 };
    const solde = agg.totalDebit - agg.totalCredit;
    return {
      numCompte,
      libelle: LIBELLES_COMPTE[numCompte] ?? "",
      soldeN1Debit: 0,
      soldeN1Credit: 0,
      mvtNDebit: agg.totalDebit,
      mvtNCredit: agg.totalCredit,
      soldeNDebit: solde > 0 ? Math.abs(solde) : 0,
      soldeNCredit: solde < 0 ? Math.abs(solde) : 0,
    };
  });
  return {
    lignes,
    totalDebitGeneral: lignes.reduce((s, l) => s + l.mvtNDebit, 0),
    totalCreditGeneral: lignes.reduce((s, l) => s + l.mvtNCredit, 0),
    soldeDebitGeneral: lignes.reduce((s, l) => s + l.soldeNDebit, 0),
    soldeCreditGeneral: lignes.reduce((s, l) => s + l.soldeNCredit, 0),
  };
}

/** Calcule le suivi du capital (initial + mouvements horodatés + solde). */
async function computeCapital(): Promise<CapitalSuivi> {
  const capitalInitial = await getCapitalInitial();
  const mvts = await db.capitalMouvement.findMany({ orderBy: { date: "asc" } });
  let soldeCumule = capitalInitial;
  const mouvements: CapitalMouvementItem[] = mvts.map((m) => {
    const sens = m.type === "ENTREE" ? "entree" : "sortie";
    if (sens === "entree") soldeCumule += m.montant;
    else soldeCumule -= m.montant;
    return {
      id: m.id,
      date: formatDateTimeFR(m.date),
      dateISO: m.date.toISOString(),
      libelle: m.libelle,
      type: sens,
      typeLabel: m.type === "ENTREE" ? "Ajout (entrée)" : "Retrait (sortie)",
      montant: m.montant,
      sens,
      soldeApres: soldeCumule,
      saisiePar: m.saisiePar ?? null,
    };
  }).reverse(); // ordre antéchronologique
  const totalEntrees = mvts.filter((m) => m.type === "ENTREE").reduce((s, m) => s + m.montant, 0);
  const totalSorties = mvts.filter((m) => m.type === "SORTIE").reduce((s, m) => s + m.montant, 0);
  return {
    capitalInitial,
    totalEntrees,
    totalSorties,
    soldeRestant: capitalInitial + totalEntrees - totalSorties,
    nbMouvements: mvts.length,
    mouvements,
  };
}

// ---------- Helpers budget ----------
interface BudgetLigneSpec {
  poste: string;
  previs: number;
  // calcule le réel depuis les données agrégées
  reel: (ctx: BudgetCtx) => number;
}
interface BudgetCtx {
  depensesParCat: Record<string, number>;
  coutAlimTotal: number;
  capitalInitial: number;
  capitalEntrees: number;
  capitalSorties: number;
  soldeCapital: number;
  totalInvestissements: number; // somme dépenses categorie=Immobilisation
}

function ligneBudget(poste: string, previs: number, reel: number): BudgetLigne {
  const ecart = previs - reel;
  const pct = previs > 0 ? (reel / previs) * 100 : 0;
  return { poste, previs, reel, ecart, pct };
}

function sousTotal(section: BudgetLigne[]): BudgetLigne {
  const previs = section.reduce((s, l) => s + l.previs, 0);
  const reel = section.reduce((s, l) => s + l.reel, 0);
  return ligneBudget("Sous-total " + section[0]?.poste, previs, reel);
  // NB: le poste du sous-total est utilisé uniquement comme libellé fallback
}

function totalGeneralSections(sections: BudgetSection[]): BudgetLigne {
  const previs = sections.reduce((s, sec) => s + sec.sousTotal.previs, 0);
  const reel = sections.reduce((s, sec) => s + sec.sousTotal.reel, 0);
  return ligneBudget("Total général", previs, reel);
}

/** Calcule le budget prévisionnel vs réel pour les 3 sous-sections. */
function computeBudget(ctx: BudgetCtx): BudgetRapport {
  const investissement: BudgetLigne[] = [
    ligneBudget("Hangars", 500_000, ctx.totalInvestissements),
    ligneBudget("Équipements (abreuvoirs, mangeoires)", 200_000, ctx.totalInvestissements),
    ligneBudget("Clôtures", 150_000, ctx.totalInvestissements),
  ];
  const operationnel: BudgetLigne[] = [
    ligneBudget("Alimentation bétail", 5_000_000, ctx.coutAlimTotal),
    ligneBudget("Vétérinaire", 200_000, ctx.depensesParCat["Vétérinaire"] ?? 0),
    ligneBudget("Transport", 100_000, ctx.depensesParCat["Transport"] ?? 0),
    ligneBudget("Salariat", 300_000, ctx.depensesParCat["Salariat"] ?? 0),
    ligneBudget("Autres charges", 50_000, ctx.depensesParCat["Autre"] ?? 0),
  ];
  const tresorerie: BudgetLigne[] = [
    ligneBudget("Financement reçu", 14_775_000, ctx.capitalInitial),
    ligneBudget("Apports", 0, ctx.capitalEntrees),
    ligneBudget("Retraits", 0, ctx.capitalSorties),
    ligneBudget("Solde net", 14_775_000, ctx.soldeCapital),
  ];
  const sections: BudgetSection[] = [
    {
      key: "investissement",
      titre: "Investissement",
      lignes: investissement,
      sousTotal: sousTotal(investissement),
    },
    {
      key: "operationnel",
      titre: "Opérationnel",
      lignes: operationnel,
      sousTotal: sousTotal(operationnel),
    },
    {
      key: "tresorerie",
      titre: "Trésorerie",
      lignes: tresorerie,
      sousTotal: sousTotal(tresorerie),
    },
  ];
  return { sections, totalGeneral: totalGeneralSections(sections) };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const yearParam = url.searchParams.get("annee");
  const now = new Date();

  const [bovinsRaw, alimentations, depenses, financementRows, alertes, capitalMvts, paramCapital] = await Promise.all([
    db.bovin.findMany({ orderBy: { identifiant: "asc" } }),
    db.alimentation.findMany({ orderBy: { date: "desc" } }),
    db.depense.findMany({ orderBy: { date: "desc" } }),
    db.financement.findMany({ include: { echeances: true } }),
    db.alerte.findMany({ orderBy: { date: "desc" } }),
    db.capitalMouvement.findMany({ orderBy: { date: "asc" } }),
    db.parametre.findUnique({ where: { cle: "capital_initial" } }),
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

    const alimMois = alimentations.filter((a) => monthKey(a.date.toISOString()) === m.key);
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

  // ---------- Section A : Balance comptable ----------
  // Construit les journaux achat/vente/dépense en mémoire puis agrège.
  const achatsEntries: JournalEntrySimple[] = bovinsRaw.flatMap((b) => {
    const montant = b.prixAchat;
    const libelle = `${b.identifiant} — ${b.race}`;
    return [
      { numCompte: "6011", libelle, debit: montant, credit: 0 },
      { numCompte: "5711", libelle, debit: 0, credit: montant },
    ];
  });
  const ventesEntries: JournalEntrySimple[] = bovinsRaw
    .filter((b) => b.statut === "VENDU" && b.dateVente)
    .flatMap((b) => {
      const montant = b.prixVente;
      const libelle = `${b.identifiant} — ${b.clientVente ?? "Client"}`;
      return [
        { numCompte: "4111", libelle, debit: montant, credit: 0 },
        { numCompte: "7011", libelle, debit: 0, credit: montant },
      ];
    });
  const depensesEntries: JournalEntrySimple[] = depenses.flatMap((d) => {
    const numCompte = numeroCompteDepense(d.categorie);
    return [
      { numCompte, libelle: d.libelle, debit: d.montant, credit: 0 },
      { numCompte: "5711", libelle: d.libelle, debit: 0, credit: d.montant },
    ];
  });
  const balance = computeBalance(achatsEntries, ventesEntries, depensesEntries);

  // ---------- Section B : Suivi du financement ----------
  const capitalInitial = paramCapital && !isNaN(Number(paramCapital.valeur))
    ? Number(paramCapital.valeur)
    : CAPITAL_INITIAL_DEFAUT;
  let soldeCumule = capitalInitial;
  const mouvements: CapitalMouvementItem[] = capitalMvts.map((m) => {
    const sens = m.type === "ENTREE" ? "entree" : "sortie";
    if (sens === "entree") soldeCumule += m.montant;
    else soldeCumule -= m.montant;
    return {
      id: m.id,
      date: formatDateTimeFR(m.date),
      dateISO: m.date.toISOString(),
      libelle: m.libelle,
      type: sens,
      typeLabel: m.type === "ENTREE" ? "Ajout (entrée)" : "Retrait (sortie)",
      montant: m.montant,
      sens,
      soldeApres: soldeCumule,
      saisiePar: m.saisiePar ?? null,
    };
  }).reverse();
  const capitalEntrees = capitalMvts.filter((m) => m.type === "ENTREE").reduce((s, m) => s + m.montant, 0);
  const capitalSorties = capitalMvts.filter((m) => m.type === "SORTIE").reduce((s, m) => s + m.montant, 0);
  const capital: CapitalSuivi = {
    capitalInitial,
    totalEntrees: capitalEntrees,
    totalSorties: capitalSorties,
    soldeRestant: capitalInitial + capitalEntrees - capitalSorties,
    nbMouvements: capitalMvts.length,
    mouvements,
  };

  // ---------- Section C : Suivi budgétaire ----------
  const depensesParCat: Record<string, number> = {};
  for (const d of depenses) {
    depensesParCat[d.categorie] = (depensesParCat[d.categorie] || 0) + d.montant;
  }
  const coutAlimTotal = alimentations.reduce((s, a) => s + a.coutTotal, 0);
  const totalInvestissements = depenses
    .filter((d) => d.categorie === "Immobilisation")
    .reduce((s, d) => s + d.montant, 0);
  const budget = computeBudget({
    depensesParCat,
    coutAlimTotal,
    capitalInitial,
    capitalEntrees,
    capitalSorties,
    soldeCapital: capital.soldeRestant,
    totalInvestissements,
  });

  // ---------- Section D : Dépenses d'investissement en immobilisations ----------
  const investissements: Investissement[] = depenses
    .filter((d) => d.categorie === "Immobilisation")
    .map((d) => ({
      id: d.id,
      date: d.date.toISOString().slice(0, 10).split("-").reverse().join("/"),
      libelle: d.libelle,
      categorie: d.categorie,
      montant: d.montant,
    }));

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
    balance,
    capital,
    budget,
    investissements,
  };

  return NextResponse.json(rapport);
}
