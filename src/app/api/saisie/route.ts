// API Saisie — journaux comptables (partie double) + balance + financement
// POST : créer une entrée (achat, vente, dépense, stock)
// GET  : récupérer un journal, la balance, ou le suivi financement
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const FINANCEMENT_INITIAL = 14_775_000;

// Comptes comptables
const COMPTES = {
  achat_bovin: { debit: "6011", credit: "5711", libelle: "Achat de bétail" },
  vente_bovin: { debit: "4111", credit: "7011", libelle: "Vente de bétail" },
  depense: { debit: "6", credit: "5711", libelle: "Dépense" },
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const type = q.get("type") ?? "all";
  const limit = type === "all" ? 5 : 100;

  if (type === "alertes") {
    const alertes: { type: string; severite: string; message: string }[] = [];
    try {
      const allStock = await db.stockMouvement.findMany();
      const stockParType: Record<string, number> = {};
      for (const m of allStock) {
        stockParType[m.typeAliment] = (stockParType[m.typeAliment] || 0) + m.entree - m.sortie;
      }
      for (const [type2, restant] of Object.entries(stockParType)) {
        if (restant < 20) {
          alertes.push({ type: "STOCK", severite: restant < 10 ? "CRITICAL" : "WARNING", message: `Stock ${type2} bas : ${restant} sacs restants` });
        }
        if (restant < 0) {
          alertes.push({ type: "STOCK", severite: "CRITICAL", message: `Stock ${type2} négatif : vérifier les sorties` });
        }
      }
      const now = new Date();
      const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
      const depensesMois = await db.depense.findMany({ where: { date: { gte: debutMois } } });
      const totalDepenses = depensesMois.reduce((s, d) => s + d.montant, 0);
      if (totalDepenses > 500000) {
        alertes.push({ type: "BUDGET", severite: "WARNING", message: `Dépenses du mois : ${totalDepenses.toLocaleString("fr-FR")} FCFA` });
      }
      const echeancesRetard = await db.echeance.findMany({ where: { statut: "EN_RETARD" } });
      if (echeancesRetard.length > 0) {
        alertes.push({ type: "ECHEANCE", severite: "CRITICAL", message: `${echeancesRetard.length} échéance(s) en retard` });
      }
    } catch (e) {
      console.error("Erreur alertes:", e);
    }
    return NextResponse.json({ alertes });
  }

  // Helper: journal d'achat (compte 6011 débit / 5711 crédit)
  async function getAchats() {
    try {
      const bovins = await db.bovin.findMany({ orderBy: { dateAchat: "desc" }, take: limit });
      return bovins.flatMap((b) => {
        const montant = b.prixAchat;
        const date = b.dateAchat.toISOString().slice(0, 10).split("-").reverse().join("/");
        return [
          { id: `${b.id}-d`, date, numCompte: "6011", libelle: `${b.identifiant} — ${b.race}`, debit: montant, credit: 0 },
          { id: `${b.id}-c`, date, numCompte: "5711", libelle: `${b.identifiant} — ${b.race}`, debit: 0, credit: montant },
        ];
      });
    } catch (e) {
      console.error("getAchats:", e);
      return [];
    }
  }

  // Helper: journal de vente (compte 4111 débit / 7011 crédit)
  async function getVentes() {
    try {
      const vendus = await db.bovin.findMany({ where: { statut: "VENDU" }, orderBy: { dateVente: "desc" }, take: limit });
      return vendus.filter((b) => b.dateVente).flatMap((b) => {
        const montant = b.prixVente;
        const date = b.dateVente!.toISOString().slice(0, 10).split("-").reverse().join("/");
        return [
          { id: `${b.id}-d`, date, numCompte: "4111", libelle: `${b.identifiant} — ${b.clientVente ?? "Client"}`, debit: montant, credit: 0 },
          { id: `${b.id}-c`, date, numCompte: "7011", libelle: `${b.identifiant} — ${b.race}`, debit: 0, credit: montant },
        ];
      });
    } catch (e) {
      console.error("getVentes:", e);
      return [];
    }
  }

  // Helper: journal de dépenses (compte 6xxx débit / 5711 crédit)
  async function getDepenses() {
    try {
      const depenses = await db.depense.findMany({ orderBy: { date: "desc" }, take: limit });
      return depenses.flatMap((d) => {
        const date = d.date.toISOString().slice(0, 10).split("-").reverse().join("/");
        const numCompte = d.categorie === "Vétérinaire" ? "615" : d.categorie === "Salariat" ? "661" : d.categorie === "Immobilisation" ? "23" : d.categorie === "Transport" ? "624" : d.categorie === "Aliment bétail" ? "6012" : "68";
        return [
          { id: `${d.id}-d`, date, numCompte, libelle: d.libelle, debit: d.montant, credit: 0 },
          { id: `${d.id}-c`, date, numCompte: "5711", libelle: d.libelle, debit: 0, credit: d.montant },
        ];
      });
    } catch (e) {
      console.error("getDepenses:", e);
      return [];
    }
  }

  // Helper: journal de stock
  async function getStock() {
    try {
      const mouvements = await db.stockMouvement.findMany({ orderBy: { date: "desc" }, take: limit });
      const allMvts = await db.stockMouvement.findMany({ orderBy: { date: "asc" } });
      const stockParType: Record<string, number> = {};
      for (const m of allMvts) {
        stockParType[m.typeAliment] = (stockParType[m.typeAliment] || 0) + m.entree - m.sortie;
      }
      const entries = mouvements.map((m) => ({
        id: m.id,
        date: m.date.toISOString().slice(0, 10).split("-").reverse().join("/"),
        libelle: m.typeAliment,
        details: m.observations ?? "",
        entree: m.entree,
        sortie: m.sortie,
        prixParSac: m.prixParSac,
        stockRestant: stockParType[m.typeAliment] ?? 0,
      }));
      const summary = Object.entries(stockParType).map(([type, restant]) => ({ type, restant }));
      return { entries, summary };
    } catch (e) {
      console.error("getStock:", e);
      return { entries: [], summary: [] };
    }
  }

  if (type === "achat") {
    const entries = await getAchats();
    const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
    const solde = totalDebit - totalCredit;
    return NextResponse.json({ entries, totalDebit, totalCredit, solde, conclusion: solde > 0 ? "Solde débitaire" : "Solde créditaire" });
  }

  if (type === "vente") {
    const entries = await getVentes();
    const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
    const solde = totalDebit - totalCredit;
    return NextResponse.json({ entries, totalDebit, totalCredit, solde, conclusion: solde > 0 ? "Solde débitaire" : "Solde créditaire" });
  }

  if (type === "depense") {
    const entries = await getDepenses();
    const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
    const solde = totalDebit - totalCredit;
    return NextResponse.json({ entries, totalDebit, totalCredit, solde, conclusion: solde > 0 ? "Solde débitaire" : "Solde créditaire" });
  }

  if (type === "balance") {
    const [achats, ventes, depenses] = await Promise.all([getAchats(), getVentes(), getDepenses()]);
    const allEntries = [...achats, ...ventes, ...depenses];
    // Libellés des comptes
    const LIBELLES: Record<string, string> = {
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
    // Regrouper par numéro de compte
    const parCompte: Record<string, { numCompte: string; libelle: string; totalDebit: number; totalCredit: number; solde: number; conclusion: string }> = {};
    for (const e of allEntries) {
      if (!parCompte[e.numCompte]) {
        parCompte[e.numCompte] = { numCompte: e.numCompte, libelle: LIBELLES[e.numCompte] ?? e.libelle.split(" — ")[0] ?? "", totalDebit: 0, totalCredit: 0, solde: 0, conclusion: "" };
      }
      parCompte[e.numCompte].totalDebit += e.debit;
      parCompte[e.numCompte].totalCredit += e.credit;
    }
    const balance = Object.values(parCompte).map((c) => {
      c.solde = c.totalDebit - c.totalCredit;
      c.conclusion = c.solde > 0 ? "Débitaire" : "Créditaire";
      return c;
    }).sort((a, b) => a.numCompte.localeCompare(b.numCompte));

    const totalDebitGeneral = balance.reduce((s, c) => s + c.totalDebit, 0);
    const totalCreditGeneral = balance.reduce((s, c) => s + c.totalCredit, 0);
    const soldeGeneral = totalDebitGeneral - totalCreditGeneral;

    return NextResponse.json({
      balance,
      totalDebitGeneral,
      totalCreditGeneral,
      soldeGeneral,
      conclusionGeneral: soldeGeneral > 0 ? "Solde général débitaire" : "Solde général créditaire",
    });
  }

  if (type === "financement") {
    const [achats, ventes] = await Promise.all([getAchats(), getVentes()]);
    // Pour le financement : les achats soustraient, les ventes ajoutent
    const mouvementsFinancement = [
      ...achats.filter((e) => e.debit > 0).map((e) => ({
        date: e.date,
        libelle: e.libelle,
        type: "achat" as const,
        montant: e.debit,
        sens: "sortie" as const,
      })),
      ...ventes.filter((e) => e.credit > 0).map((e) => ({
        date: e.date,
        libelle: e.libelle,
        type: "vente" as const,
        montant: e.credit,
        sens: "entree" as const,
      })),
    ].sort((a, b) => b.date.localeCompare(a.date)); // tri par date décroissante

    // Calculer le solde cumulé
    let soldeCumule = FINANCEMENT_INITIAL;
    const mouvementsAvecSolde = mouvementsFinancement.map((m) => {
      if (m.sens === "sortie") {
        soldeCumule -= m.montant;
      } else {
        soldeCumule += m.montant;
      }
      return { ...m, soldeApres: soldeCumule };
    });

    const totalAchats = mouvementsFinancement.filter((m) => m.sens === "sortie").reduce((s, m) => s + m.montant, 0);
    const totalVentes = mouvementsFinancement.filter((m) => m.sens === "entree").reduce((s, m) => s + m.montant, 0);
    const soldeRestant = FINANCEMENT_INITIAL - totalAchats + totalVentes;

    return NextResponse.json({
      financementInitial: FINANCEMENT_INITIAL,
      totalAchats,
      totalVentes,
      soldeRestant,
      mouvements: mouvementsAvecSolde,
    });
  }

  if (type === "stock") {
    const { entries, summary } = await getStock();
    return NextResponse.json({ entries, summary });
  }

  // all
  const [achats, ventes, depenses, stock] = await Promise.all([getAchats(), getVentes(), getDepenses(), getStock()]);
  return NextResponse.json({ achats, ventes, depenses, stock: stock.entries, stockSummary: stock.summary });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, ...data } = body;

  if (type === "achat") {
    const especeVal = (data.espece as string) || "BOVIN";
    const prefix = especeVal === "OVIN" ? "OVI" : "BOV";
    const countEspece = await db.bovin.count({ where: { espece: especeVal } });
    const bovin = await db.bovin.create({
      data: {
        identifiant: `${prefix}-${String(countEspece + 1).padStart(3, "0")}`,
        espece: especeVal,
        race: data.race ?? "Zébu", sexe: data.sexe ?? "Mâle",
        dateAchat: new Date(data.date),
        prixAchat: Number(data.prixUnitaire) * Number(data.nbSujets ?? 1),
        poidsAchat: Number(data.poids ?? 0), statut: "EN_ENGRAISSEMENT",
        coutsEngraissement: 0, autresCouts: 0, prixVente: 0,
      },
    });
    return NextResponse.json({ ok: true, id: bovin.id, identifiant: bovin.identifiant });
  }

  if (type === "vente") {
    const bovin = await db.bovin.findFirst({ where: { statut: "EN_ENGRAISSEMENT" }, orderBy: { dateAchat: "asc" } });
    if (!bovin) return NextResponse.json({ ok: false, error: "Aucun bovin disponible" }, { status: 400 });
    const updated = await db.bovin.update({
      where: { id: bovin.id },
      data: { statut: "VENDU", dateVente: new Date(data.date), prixVente: Number(data.prixUnitaire) * Number(data.nbSujets ?? 1), clientVente: data.acheteur ?? "Client" },
    });
    return NextResponse.json({ ok: true, id: updated.id, identifiant: updated.identifiant });
  }

  if (type === "depense") {
    const depense = await db.depense.create({
      data: { date: new Date(data.date), categorie: data.categorie ?? "Autre", libelle: data.libelle ?? "", montant: Number(data.montant ?? 0), nbBovinsConcernes: 0 },
    });
    return NextResponse.json({ ok: true, id: depense.id });
  }

  if (type === "stock") {
    const mvt = await db.stockMouvement.create({
      data: { date: new Date(data.date), typeAliment: data.typeAliment ?? "Son", entree: Number(data.entree ?? 0), sortie: Number(data.sortie ?? 0), prixParSac: Number(data.prixParSac ?? 0), observations: data.observations ?? null },
    });
    return NextResponse.json({ ok: true, id: mvt.id });
  }

  return NextResponse.json({ ok: false, error: "Type inconnu" }, { status: 400 });
}
