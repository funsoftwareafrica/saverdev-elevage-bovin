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
// Plan comptable SAVERDEV officiel (6 chiffres) — seuls les comptes avec données sont affichés.
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
  "321000": "Matières A",
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
  "612000": "Transports sur ventes",
  "614000": "Transports du personnel",
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
const ORDRE_COMPTES = Object.keys(LIBELLES_COMPTE);

interface JournalEntrySimple { numCompte: string; libelle: string; debit: number; credit: number; }

function numeroCompteDepense(categorie: string): string {
  switch (categorie) {
    case "Alimentation": return "602100";
    case "Salaires": return "661100";
    case "Transport": return "612000";
    case "Matériel": return "605600";
    case "Gestion de l'eau": return "605100";
    case "Santé": return "624800";
    case "Loyer": return "622200";
    case "Communication": return "632700";
    case "Événement": return "605700";
    case "Immobilisation": return "234100";
    default: return "624800";
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
  // Filtrer : ne garder QUE les comptes avec mouvements non-zéro
  const lignes: BalanceLigne[] = ORDRE_COMPTES
    .filter((numCompte) => {
      const agg = parCompte[numCompte];
      return agg && (agg.totalDebit > 0 || agg.totalCredit > 0);
    })
    .map((numCompte) => {
      const agg = parCompte[numCompte];
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
      { numCompte: "601100", libelle, debit: montant, credit: 0 },
      { numCompte: "571100", libelle, debit: 0, credit: montant },
    ];
  });
  const ventesEntries: JournalEntrySimple[] = bovinsRaw
    .filter((b) => b.statut === "VENDU" && b.dateVente)
    .flatMap((b) => {
      const montant = b.prixVente;
      const libelle = `${b.identifiant} — ${b.clientVente ?? "Client"}`;
      return [
        { numCompte: "411100", libelle, debit: montant, credit: 0 },
        { numCompte: "701100", libelle, debit: 0, credit: montant },
      ];
    });
  const depensesEntries: JournalEntrySimple[] = depenses.flatMap((d) => {
    const numCompte = numeroCompteDepense(d.categorie);
    return [
      { numCompte, libelle: d.libelle, debit: d.montant, credit: 0 },
      { numCompte: "571100", libelle: d.libelle, debit: 0, credit: d.montant },
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
