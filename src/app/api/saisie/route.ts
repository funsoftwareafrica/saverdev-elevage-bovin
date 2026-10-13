// API Saisie — journaux comptables (partie double)
// POST : créer une entrée (achat, vente, dépense, stock, capital_mouvement)
// GET  : récupérer un journal (achat/vente/depense/stock), les alertes ou un
//        récapitulatif global.
//
// Note (Task 29) : la balance comptable et le suivi du financement ne sont
// plus exposés ici — ils ont migré vers le rapport bailleur :
//   - balance     → GET /api/rapport-bailleur/balance
//   - financement → champ `capital` du GET /api/rapport-bailleur
// Les POST capital_mouvement / capital_mouvement_delete restent disponibles
// ici (utilisés par le formulaire « Suivi du financement » du rapport bailleur).
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
import { emitNotification, emitSaisieUpdate } from "@/lib/ws-emit";
import { withRateLimit } from "@/lib/rate-limit";
import { getSchemaForType } from "@/lib/validations";
import {
  applySaisieOperation,
  serializeSaisie,
  saisieResultToResponse,
  type SaisiePayload,
} from "@/lib/saisie-ops";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const type = q.get("type") ?? "all";
  // Task 29 : balance + financement ont migré vers le rapport bailleur.
  // On répond 404 avec une indication de redirection pour ne pas renvoyer
  // silencieusement le récapitulatif "all" à un client qui attendait l'ancien
  // format (champ `balance` ou `mouvements`).
  if (type === "balance" || type === "financement") {
    return NextResponse.json(
      {
        error: "Endpoint déplacé",
        redirect:
          type === "balance"
            ? "/api/rapport-bailleur/balance"
            : "/api/rapport-bailleur (champ `capital`)",
      },
      { status: 404 }
    );
  }
  // Task 31-B : "capital" est un alias client de l'ancien "financement" —
  // renvoie le suivi du capital initial + mouvements horodatés. Anciennement
  // exposé via GET /api/saisie?type=financement (qui répondait 404 depuis
  // la Task 29). On rétablit la disponibilité sous le nouvel alias.
  if (type === "capital") {
    return getCapitalSuivi();
  }
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

  if (type === "stock") {
    const { entries, summary } = await getStock();
    return NextResponse.json({ entries, summary });
  }

  // Task 31-B : journal "Dépenses d'investissement" — alias client du journal
  // des dépenses filtré sur categorie === "Immobilisation" (compte 23).
  // On renvoie les lignes en partie double (compte 23 débit / 5711 crédit).
  if (type === "investissement") {
    const depenses = await db.depense.findMany({
      where: { categorie: "Immobilisation" },
      orderBy: { date: "desc" },
      take: limit,
    });
    const entries = depenses.flatMap((d) => {
      const date = d.date.toISOString().slice(0, 10).split("-").reverse().join("/");
      return [
        { id: `${d.id}-d`, date, numCompte: "23", libelle: d.libelle, debit: d.montant, credit: 0 },
        { id: `${d.id}-c`, date, numCompte: "5711", libelle: d.libelle, debit: 0, credit: d.montant },
      ];
    });
    const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
    const solde = totalDebit - totalCredit;
    return NextResponse.json({ entries, totalDebit, totalCredit, solde, conclusion: solde > 0 ? "Solde débitaire" : "Solde créditaire" });
  }

  // all
  const [achats, ventes, depenses, stock] = await Promise.all([getAchats(), getVentes(), getDepenses(), getStock()]);
  return NextResponse.json({ achats, ventes, depenses, stock: stock.entries, stockSummary: stock.summary });
}

// ============================================================
//  Task 31-B : suivi du capital (alias client "capital")
//  Renvoie le capital initial figé + la liste des mouvements
//  horodatés (déplacé depuis /api/rapport-bailleur pour exposer
//  un endpoint GET /api/saisie?type=capital dédié au journal
//  de saisie "Suivi du capital" dans la vue Saisie).
// ============================================================
const CAPITAL_INITIAL_DEFAUT = 14_775_000;

async function getCapitalSuivi() {
  let capitalInitial = CAPITAL_INITIAL_DEFAUT;
  try {
    const param = await db.parametre.findUnique({ where: { cle: "capital_initial" } });
    if (param) {
      const n = Number(param.valeur);
      if (!isNaN(n) && n >= 0) capitalInitial = n;
    }
  } catch (e) {
    console.error("getCapitalSuivi:", e);
  }
  const mvts = await db.capitalMouvement.findMany({ orderBy: { date: "asc" } });
  let soldeCumule = capitalInitial;
  const mouvements = mvts.map((m) => {
    const sens = m.type === "ENTREE" ? "entree" : "sortie";
    if (sens === "entree") soldeCumule += m.montant;
    else soldeCumule -= m.montant;
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${pad(m.date.getDate())}/${pad(m.date.getMonth() + 1)}/${m.date.getFullYear()} ${pad(m.date.getHours())}:${pad(m.date.getMinutes())}`;
    return {
      id: m.id,
      date: dateStr,
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
  const totalEntrees = mvts.filter((m) => m.type === "ENTREE").reduce((s, m) => s + m.montant, 0);
  const totalSorties = mvts.filter((m) => m.type === "SORTIE").reduce((s, m) => s + m.montant, 0);
  return NextResponse.json({
    capitalInitial,
    totalEntrees,
    totalSorties,
    soldeRestant: capitalInitial + totalEntrees - totalSorties,
    nbMouvements: mvts.length,
    mouvements,
  });
}

async function postHandler(req: NextRequest) {
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
  // Task 31-B : ajout des alias UI "investissement" et "capital" dans la
  // liste des types valides (alias client de "depense" / "capital_mouvement").
  const validTypes: SaisiePayload["type"][] = [
    "achat", "vente", "depense", "stock", "capital_mouvement",
    "investissement", "capital",
  ];
  if (!validTypes.includes(saisieType)) {
    return NextResponse.json({ ok: false, error: "Type inconnu" }, { status: 400 });
  }

  // ===== Validation Zod stricte du payload selon le type =====
  // On valide AVANT de créer la Validation EN_ATTENTE pour ne pas stocker
  // des données invalides qui exploseraient au moment de l'application
  // réelle par l'E2A (PATCH /api/validations/[id]).
  //
  // En cas d'échec : HTTP 400 avec les détails Zod flatten (champs en erreur,
  // messages lisibles) — pratique pour le débogage côté frontend.
  const schema = getSchemaForType(saisieType);
  if (schema) {
    const result = schema.safeParse(data);
    if (!result.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Données invalides",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }
    // On remplace `data` par la version parsée/normalisée par Zod
    // (les transformations .default(), .trim() éventuelles seront appliquées).
    Object.assign(data, result.data);
  }

  // ===== Task 31-B : verrouillage des clôtures de mois comptable =====
  // Si la date de la saisie (champ `date` ISO YYYY-MM-DD ou datetime-local)
  // tombe dans un mois marqué `cloture=true` dans la table MoisCloture,
  // on refuse la saisie avec HTTP 403. Les types capital_initial_update et
  // capital_mouvement_delete ne sont pas concernés (gérés avant ce bloc).
  try {
    const rawDate = (data.date as string | undefined) ?? null;
    if (rawDate) {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        const mois = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
        const cloture = await db.moisCloture.findUnique({ where: { mois } });
        if (cloture?.cloture) {
          return NextResponse.json(
            { ok: false, error: "Mois clôturé, saisie impossible" },
            { status: 403 }
          );
        }
      }
    }
  } catch (e) {
    console.error("MoisCloture check:", e);
    // Tolérant : si la table MoisCloture n'existe pas encore (DB non
    // poussée), on laisse passer la saisie.
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
      : saisieType === "depense" || saisieType === "investissement"
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
        entiteType: saisieType === "achat" || saisieType === "vente"
          ? "Bovin"
          : saisieType === "depense" || saisieType === "investissement"
          ? "Depense"
          : saisieType === "stock"
          ? "StockMouvement"
          : "CapitalMouvement",
        entiteId: result.id,
        userId: saisieParId,
        details: `Saisie directe (${saisieType}) par ${saisiePar}`,
      },
    }).catch(() => null);
    // Task 31-B : émet un event WS "saisie:new" pour revalidation temps réel
    // multi-user (frontend écoute → invalidate TanStack Query).
    void emitSaisieUpdate(saisieType);
  }
  return saisieResultToResponse(result);
}

// Wrapper avec rate limiting : max 10 saisies / minute / IP (anti-spam).
// Au-delà : HTTP 429 Too Many Requests avec Retry-After.
// On déclare POST en dernière position pour qu'il soit bindé après postHandler
// (Next.js lit les exports `GET`/`POST` au module-level via Reflect metadata).
export const POST = withRateLimit(postHandler, { maxPerMinute: 10 });
