module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db",
    ()=>db
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const globalForPrisma = globalThis;
const db = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    log: [
        'query'
    ]
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = db;
}),
"[project]/src/lib/server-mappers.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Helpers serveur — conversion Prisma → interfaces TypeScript partagées.
// Prisma renvoie des Date ; le client attend des string ISO.
__turbopack_context__.s([
    "toAlerte",
    ()=>toAlerte,
    "toAlimentation",
    ()=>toAlimentation,
    "toBovin",
    ()=>toBovin,
    "toDepense",
    ()=>toDepense,
    "toEcheance",
    ()=>toEcheance,
    "toFinancement",
    ()=>toFinancement,
    "toHistorique",
    ()=>toHistorique
]);
function toBovin(b) {
    return {
        id: b.id,
        identifiant: b.identifiant,
        race: b.race,
        sexe: b.sexe,
        dateAchat: b.dateAchat.toISOString(),
        prixAchat: b.prixAchat,
        poidsAchat: b.poidsAchat,
        statut: b.statut,
        dateVente: b.dateVente ? b.dateVente.toISOString() : null,
        prixVente: b.prixVente,
        coutsEngraissement: b.coutsEngraissement,
        autresCouts: b.autresCouts,
        clientVente: b.clientVente
    };
}
function toAlimentation(a) {
    return {
        id: a.id,
        date: a.date.toISOString(),
        produit: a.produit,
        quantite: a.quantite,
        unite: a.unite,
        coutTotal: a.coutTotal,
        nbBovinsConcernes: a.nbBovinsConcernes,
        coutParTete: a.coutParTete,
        commentaire: a.commentaire
    };
}
function toDepense(d) {
    return {
        id: d.id,
        date: d.date.toISOString(),
        categorie: d.categorie,
        libelle: d.libelle,
        montant: d.montant,
        nbBovinsConcernes: d.nbBovinsConcernes
    };
}
function toEcheance(e) {
    return {
        id: e.id,
        numero: e.numero,
        datePrevue: e.datePrevue.toISOString(),
        montant: e.montant,
        statut: e.statut,
        datePayee: e.datePayee ? e.datePayee.toISOString() : null
    };
}
function toFinancement(f) {
    return {
        id: f.id,
        bailleur: f.bailleur,
        montantFinance: f.montantFinance,
        dateOctroi: f.dateOctroi.toISOString(),
        tauxInteret: f.tauxInteret,
        dureeMois: f.dureeMois,
        echeances: f.echeances.map(toEcheance).sort((a, b)=>a.numero - b.numero)
    };
}
function toAlerte(a) {
    return {
        id: a.id,
        date: a.date.toISOString(),
        type: a.type,
        severite: a.severite,
        message: a.message,
        resolved: a.resolved
    };
}
function toHistorique(h) {
    return {
        id: h.id,
        date: h.date.toISOString(),
        action: h.action,
        entiteType: h.entiteType,
        entiteId: h.entiteId,
        details: h.details,
        user: h.user ? {
            name: h.user.name
        } : null
    };
}
}),
"[project]/src/lib/calculations.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Calculs purs — réutilisables côté serveur (API) et client (vues).
// Aucune dépendance à React ou aux données mockées.
__turbopack_context__.s([
    "computeBovinMarge",
    ()=>computeBovinMarge,
    "computeDashboardFromData",
    ()=>computeDashboardFromData
]);
function computeBovinMarge(b) {
    const coutRevient = b.prixAchat + b.coutsEngraissement + b.autresCouts;
    const marge = b.statut === "VENDU" ? b.prixVente - coutRevient : null;
    return {
        coutRevient,
        marge
    };
}
/** Retourne la clé mois "YYYY-MM" d'une date ISO. */ function monthKey(iso) {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
/** Construit la liste des mois couvrant la période où il y a des données.
 *  Trouve la 1ère et la dernière date de données, génère les mois intermédiaires.
 *  Garantit min 6 mois ; limite à maxMonths (on garde les plus récents). */ function dataMonths(dates, minMonths = 6, maxMonths = 18) {
    const now = new Date();
    let earliest = null;
    let latest = null;
    for (const iso of dates){
        const d = new Date(iso);
        if (isNaN(d.getTime())) continue;
        if (!earliest || d < earliest) earliest = d;
        if (!latest || d > latest) latest = d;
    }
    // Si aucune date de données → derniers minMonths mois jusqu'à maintenant
    if (!earliest || !latest) {
        const out = [];
        for(let i = minMonths - 1; i >= 0; i--){
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            out.push({
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
                label: d.toLocaleDateString("fr-FR", {
                    month: "short"
                }).replace(".", "")
            });
        }
        return out;
    }
    const start = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    const end = new Date(Math.max(latest.getTime(), now.getTime()));
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    const all = [];
    const cur = new Date(start);
    while(cur <= endMonth){
        all.push({
            key: `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`,
            label: cur.toLocaleDateString("fr-FR", {
                month: "short"
            }).replace(".", "")
        });
        cur.setMonth(cur.getMonth() + 1);
    }
    // Si trop de mois, on garde les plus récents (maxMonths)
    if (all.length > maxMonths) return all.slice(all.length - maxMonths);
    // Si pas assez de mois, on complète par le passé
    while(all.length < minMonths){
        const first = all[0];
        const [y, m] = first.key.split("-").map(Number);
        const d = new Date(y, m - 2, 1);
        all.unshift({
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
            label: d.toLocaleDateString("fr-FR", {
                month: "short"
            }).replace(".", "")
        });
    }
    return all;
}
function computeDashboardFromData(data) {
    const { bovins, alimentations, depenses = [], financement, alertes } = data;
    const actifs = bovins.filter((b)=>b.statut === "EN_ENGRAISSEMENT");
    const vendus = bovins.filter((b)=>b.statut === "VENDU");
    const morts = bovins.filter((b)=>b.statut === "MORT");
    // Rentabilité
    const ca = vendus.reduce((s, b)=>s + b.prixVente, 0);
    const coutAchat = vendus.reduce((s, b)=>s + b.prixAchat, 0);
    const coutEngrais = vendus.reduce((s, b)=>s + b.coutsEngraissement + b.autresCouts, 0);
    const margeTotale = vendus.reduce((s, b)=>s + (b.prixVente - b.prixAchat - b.coutsEngraissement - b.autresCouts), 0);
    const margeParTete = vendus.length ? margeTotale / vendus.length : 0;
    // Alimentation
    const nbSacs = alimentations.reduce((s, a)=>s + a.quantite, 0);
    const coutAlimTotal = alimentations.reduce((s, a)=>s + a.coutTotal, 0);
    const coutAlimParTete = bovins.length ? coutAlimTotal / (actifs.length + vendus.length) : 0;
    // Valeur du cheptel
    const valeurCheptel = actifs.reduce((s, b)=>s + b.prixAchat + b.coutsEngraissement, 0);
    // Engraissement : durée moyenne
    const durees = vendus.map((b)=>{
        if (!b.dateVente) return 0;
        return Math.round((new Date(b.dateVente).getTime() - new Date(b.dateAchat).getTime()) / (1000 * 60 * 60 * 24));
    });
    const dureeMoyenne = durees.length ? durees.reduce((s, d)=>s + d, 0) / durees.length : 0;
    // Financement
    const echeances = financement.echeances;
    const payees = echeances.filter((e)=>e.statut === "PAYEE");
    const aPayer = echeances.filter((e)=>e.statut === "A_PAYER");
    const enRetard = echeances.filter((e)=>e.statut === "EN_RETARD");
    const montantUtilise = payees.reduce((s, e)=>s + e.montant, 0);
    const tauxUtilisation = montantUtilise / financement.montantFinance * 100;
    // === Évolution mensuelle RÉELLE ===
    // CA mensuel = somme des ventes (prixVente) des bovins vendus ce mois
    // Coûts mensuels = achats de bovins (prixAchat) + alimentations (coutTotal) + dépenses (montant)
    // Marge = CA - Coûts
    // La fenêtre couvre la période réelle des données (min 6, max 12 mois)
    const allDates = [
        ...bovins.map((b)=>b.dateAchat),
        ...vendus.map((b)=>b.dateVente).filter(Boolean),
        ...alimentations.map((a)=>a.date),
        ...depenses.map((d)=>d.date)
    ];
    const months = dataMonths(allDates);
    const evolutionMensuelle = months.map((m)=>{
        const caMois = vendus.filter((b)=>b.dateVente && monthKey(b.dateVente) === m.key).reduce((s, b)=>s + b.prixVente, 0);
        const coutAchatMois = bovins.filter((b)=>monthKey(b.dateAchat) === m.key).reduce((s, b)=>s + b.prixAchat, 0);
        const coutAlimMois = alimentations.filter((a)=>monthKey(a.date) === m.key).reduce((s, a)=>s + a.coutTotal, 0);
        const coutDepMois = depenses.filter((d)=>monthKey(d.date) === m.key).reduce((s, d)=>s + d.montant, 0);
        const couts = coutAchatMois + coutAlimMois + coutDepMois;
        const marge = caMois - couts;
        return {
            mois: m.label,
            ca: caMois,
            couts,
            marge
        };
    });
    // === Ventes par mois RÉELLES ===
    const ventesParMois = months.map((m)=>{
        const bovinsVendusMois = vendus.filter((b)=>b.dateVente && monthKey(b.dateVente) === m.key);
        return {
            mois: m.label,
            ventes: bovinsVendusMois.reduce((s, b)=>s + b.prixVente, 0),
            nbTetes: bovinsVendusMois.length
        };
    });
    return {
        cheptel: {
            bovinsActifs: actifs.length,
            bovinsVendus: vendus.length,
            entreesMois: 1,
            sortiesMois: 1,
            mortalite: morts.length,
            valeurCheptel
        },
        engraissement: {
            dureeMoyenneJours: Math.round(dureeMoyenne),
            nbEnCycle: actifs.length,
            poidsMoyen: Math.round(actifs.reduce((s, b)=>s + b.poidsAchat, 0) / Math.max(1, actifs.length))
        },
        alimentation: {
            nbSacs,
            coutTotal: coutAlimTotal,
            coutParTete: coutAlimParTete
        },
        rentabilite: {
            ca,
            coutAchat,
            coutEngraissement: coutEngrais,
            margeParTete,
            margeTotale
        },
        financement: {
            montantFinance: financement.montantFinance,
            montantUtilise,
            solde: financement.montantFinance - montantUtilise,
            echeancesPayees: payees.length,
            echeancesAPayer: aPayer.length,
            echeancesEnRetard: enRetard.length,
            tauxUtilisation
        },
        alertes,
        evolutionMensuelle,
        ventesParMois
    };
}
}),
"[project]/src/app/api/dashboard/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
// GET /api/dashboard — tableau de bord agrégé (KPI 6 blocs + graphiques + alertes)
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$server$2d$mappers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/server-mappers.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$calculations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/calculations.ts [app-route] (ecmascript)");
;
;
;
;
async function GET() {
    const [bovins, alimentations, depenses, financementRows, alertes] = await Promise.all([
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].bovin.findMany({
            orderBy: {
                identifiant: "asc"
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].alimentation.findMany({
            orderBy: {
                date: "desc"
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].depense.findMany({
            orderBy: {
                date: "desc"
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].financement.findMany({
            include: {
                echeances: true
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].alerte.findMany({
            orderBy: {
                date: "desc"
            }
        })
    ]);
    // Pour la démo : on prend le 1er financement (SAVERDEV)
    const financement = financementRows[0] ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$server$2d$mappers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toFinancement"])(financementRows[0]) : {
        id: "",
        bailleur: "—",
        montantFinance: 0,
        dateOctroi: new Date().toISOString(),
        tauxInteret: 0,
        dureeMois: 0,
        echeances: []
    };
    const dashboard = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$calculations$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["computeDashboardFromData"])({
        bovins: bovins.map(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$server$2d$mappers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toBovin"]),
        alimentations: alimentations.map(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$server$2d$mappers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toAlimentation"]),
        depenses: depenses.map(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$server$2d$mappers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toDepense"]),
        financement,
        alertes: alertes.map(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$server$2d$mappers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toAlerte"])
    });
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(dashboard);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__eb30536a._.js.map