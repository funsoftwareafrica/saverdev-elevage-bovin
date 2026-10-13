// API Saisie — journaux comptables (partie double) + balance + financement
// POST : créer une entrée (achat, vente, dépense, stock, capital_mouvement)
// GET  : récupérer un journal, la balance, ou le suivi financement
//
// Workflow de validation à 2 niveaux (cahier des charges §9) :
//  - Le Bénéficiaire (SAVERDEV) saisit → l'opération est mise EN_ATTENTE
//    dans la table Validation. L'opération n'est PAS appliquée en base.
//  - L'E2A (admin) valide ou rejette depuis la vue Validations.
//  - À la validation, l'opération est réellement appliquée via
//    applySaisieOperation() (cf. lib/saisie-ops.ts).
//  - L'E2A et la SINERGI saisissent directement (pas de file d'attente).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { emitNotification } from "@/lib/ws-emit";
import {
  applySaisieOperation,
  serializeSaisie,
  saisieResultToResponse,
  type SaisiePayload,
} from "@/lib/saisie-ops";

// Capital initial par défaut (utilisé si aucun Parametre "capital_initial" en DB)
const CAPITAL_INITIAL_DEFAUT = 14_775_000;

/** Récupère le capital initial depuis la table Parametre (statique, immuable
 * depuis l'UI). Si absent, retourne la valeur par défaut. */
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
    // Capital initial STATIQUE (depuis Parametre) — jamais modifié par les mouvements
    const capitalInitial = await getCapitalInitial();

    // Mouvements manuels CapitalMouvement, triés par date chronologique (asc)
    // pour calculer le solde cumulé après chaque opération.
    const mvts = await db.capitalMouvement.findMany({ orderBy: { date: "asc" } });

    let soldeCumule = capitalInitial;
    const mouvements = mvts.map((m) => {
      const sens = m.type === "ENTREE" ? "entree" : "sortie";
      if (sens === "entree") {
        soldeCumule += m.montant;
      } else {
        soldeCumule -= m.montant;
      }
      return {
        id: m.id,
        date: formatDateTimeFR(m.date),
        dateISO: m.date.toISOString(),
        libelle: m.libelle,
        type: m.type === "ENTREE" ? "entree" : "sortie", // pour compat UI
        typeLabel: m.type === "ENTREE" ? "Ajout (entrée)" : "Retrait (sortie)",
        montant: m.montant,
        sens,
        soldeApres: soldeCumule,
        saisiePar: m.saisiePar ?? null,
      };
    }).reverse(); // ordre antéchronologique pour l'affichage

    const totalEntrees = mvts.filter((m) => m.type === "ENTREE").reduce((s, m) => s + m.montant, 0);
    const totalSorties = mvts.filter((m) => m.type === "SORTIE").reduce((s, m) => s + m.montant, 0);
    const soldeRestant = capitalInitial + totalEntrees - totalSorties;

    return NextResponse.json({
      capitalInitial,             // CAPITAL INITIAL — STATIQUE ET TOUJOURS VISIBLE
      totalEntrees,               // somme des ajouts
      totalSorties,               // somme des retraits
      soldeRestant,               // capital initial + entrées - sorties
      nbMouvements: mvts.length,
      mouvements,                 // liste horodatée (avec heures + minutes)
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

  // --- Types non soumis à validation (gestion directe) ---
  if (type === "capital_initial_update") {
    const montant = Number(data.montant);
    if (isNaN(montant) || montant < 0) {
      return NextResponse.json({ ok: false, error: "Montant invalide" }, { status: 400 });
    }
    const existing = await db.parametre.findUnique({ where: { cle: "capital_initial" } });
    if (existing) {
      await db.parametre.update({ where: { cle: "capital_initial" }, data: { valeur: String(montant) } });
    } else {
      await db.parametre.create({ data: { cle: "capital_initial", valeur: String(montant) } });
    }
    return NextResponse.json({ ok: true, capitalInitial: montant });
  }

  if (type === "capital_mouvement_delete") {
    const id = String(data.id ?? "");
    if (!id) return NextResponse.json({ ok: false, error: "ID requis" }, { status: 400 });
    try {
      await db.capitalMouvement.delete({ where: { id } });
    } catch {
      return NextResponse.json({ ok: false, error: "Mouvement introuvable" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  // --- Types soumis à validation (achat, vente, depense, stock, capital_mouvement) ---
  // On autorise les requêtes non authentifiées : la saisie sera mise en attente
  // avec saisiePar = "Bénéficiaire" (fallback) — l'E2A validera ensuite.
  const { session } = await requireRole(["BENEFICIAIRE", "E2A", "SINERGI"]);
  const role = session?.user?.role;
  const saisiePar = session?.user?.email ?? "Bénéficiaire";
  const saisieParId = session?.user?.id ?? null;

  const saisieType = type as SaisiePayload["type"];
  const validTypes: SaisiePayload["type"][] = ["achat", "vente", "depense", "stock", "capital_mouvement"];
  if (!validTypes.includes(saisieType)) {
    return NextResponse.json({ ok: false, error: "Type inconnu" }, { status: 400 });
  }

  const payload: SaisiePayload = { type: saisieType, data };

  // Le Bénéficiaire (ou requête non authentifiée) passe par le workflow de
  // validation : on crée une entrée EN_ATTENTE dans la table Validation sans
  // appliquer l'opération en base. Le commentaire stocke le JSON du payload
  // pour audit (l'application réelle se fait via PATCH /api/validations/[id]).
  if (role === "BENEFICIAIRE" || role === undefined) {
    const action = serializeSaisie(payload);
    const entiteType = saisieType === "achat"
      ? "Bovin"
      : saisieType === "vente"
      ? "Vente"
      : saisieType === "depense"
      ? "Depense"
      : saisieType === "stock"
      ? "StockMouvement"
      : "CapitalMouvement";
    const val = await db.validation.create({
      data: {
        entiteType,
        entiteId: "pending",
        action,
        statut: "EN_ATTENTE",
        saisiePar,
        dateSaisie: new Date(),
        commentaire: action, // miroir du payload pour audit (lisible côté UI)
      },
    });
    await db.historique.create({
      data: {
        action: "VALIDATION_PENDING",
        entiteType: "Validation",
        entiteId: val.id,
        userId: saisieParId,
        details: `Saisie ${saisieType} en attente de validation E2A (par ${saisiePar})`,
      },
    }).catch(() => null);
    // Notifie la E2A en temps réel qu'une saisie attend validation.
    void emitNotification({
      type: "VALIDATION",
      titre: "Nouvelle saisie à valider",
      message: `Saisie ${saisieType} par ${saisiePar} — en attente de validation E2A`,
      date: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        ok: true,
        pending: true,
        validationId: val.id,
        message: "Saisie soumise à validation E2A",
      },
      { status: 202 }
    );
  }

  // E2A / SINERGI → application directe
  const result = await applySaisieOperation(payload);
  if (result.ok && saisieParId) {
    await db.historique.create({
      data: {
        action: `SAISIE_DIRECTE_${saisieType.toUpperCase()}`,
        entiteType: saisieType === "achat" || saisieType === "vente" ? "Bovin" : saisieType === "depense" ? "Depense" : saisieType === "stock" ? "StockMouvement" : "CapitalMouvement",
        entiteId: result.id,
        userId: saisieParId,
        details: `Saisie directe (${saisieType}) par ${saisiePar}`,
      },
    }).catch(() => null);
  }
  return saisieResultToResponse(result);
}
