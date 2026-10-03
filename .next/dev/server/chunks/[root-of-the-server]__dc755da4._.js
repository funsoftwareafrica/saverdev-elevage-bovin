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
"[project]/src/app/api/rapport-bailleur/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
// GET /api/rapport-bailleur — synthèse mensuelle pour le bailleur (modèle Excel E2A)
// Retourne : KPIs + données mensuelles (12 mois) + structure des coûts + alertes.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$server$2d$mappers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/server-mappers.ts [app-route] (ecmascript)");
;
;
;
/** Clé mois "YYYY-MM" d'une date ISO. */ function monthKey(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
/** Liste des 12 mois de l'exercice (Jan → Déc de l'année courante). */ function exerciceMonths(year) {
    const labels = [
        "Janv.",
        "Févr.",
        "Mars",
        "Avr.",
        "Mai",
        "Juin",
        "Juil.",
        "Août",
        "Sept.",
        "Oct.",
        "Nov.",
        "Déc."
    ];
    return labels.map((label, i)=>({
            key: `${year}-${String(i + 1).padStart(2, "0")}`,
            label
        }));
}
async function GET(req) {
    const url = new URL(req.url);
    const yearParam = url.searchParams.get("annee");
    const now = new Date();
    const [bovinsRaw, alimentations, depenses, financementRows, alertes] = await Promise.all([
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
    const bovins = bovinsRaw.map(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$server$2d$mappers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toBovin"]);
    // Auto-détection de l'année : si l'année demandée n'a aucune donnée,
    // on prend l'année de l'activité la plus récente (achat ou vente).
    let year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
    const hasDataInYear = (y)=>bovins.some((b)=>new Date(b.dateAchat).getFullYear() === y || b.dateVente && new Date(b.dateVente).getFullYear() === y);
    if (!hasDataInYear(year)) {
        // Trouver l'année avec le plus de données
        const years = new Set();
        for (const b of bovins){
            years.add(new Date(b.dateAchat).getFullYear());
            if (b.dateVente) years.add(new Date(b.dateVente).getFullYear());
        }
        if (years.size > 0) year = Math.max(...years);
    }
    const financement = financementRows[0] ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$server$2d$mappers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toFinancement"])(financementRows[0]) : null;
    const montantFinance = financement?.montantFinance ?? 0;
    const months = exerciceMonths(year);
    // Pré-calcul des échéances payées
    const echeancesPayees = financement?.echeances.filter((e)=>e.statut === "PAYEE") ?? [];
    const monthly = months.map((m)=>{
        const endOfMonth = new Date(year, parseInt(m.key.split("-")[1], 10), 0, 23, 59, 59);
        const bovinsActifsMois = bovins.filter((b)=>{
            const achat = new Date(b.dateAchat);
            if (achat > endOfMonth) return false;
            if (b.statut === "EN_ENGRAISSEMENT") return true;
            if (b.statut === "VENDU" && b.dateVente) return new Date(b.dateVente) > endOfMonth;
            return false;
        });
        const achatsMois = bovins.filter((b)=>monthKey(b.dateAchat) === m.key);
        const ventesMois = bovins.filter((b)=>b.statut === "VENDU" && b.dateVente && monthKey(b.dateVente) === m.key);
        const mortaliteMois = bovins.filter((b)=>b.statut === "MORT" && monthKey(b.dateAchat) === m.key);
        const valeurCheptel = bovinsActifsMois.reduce((s, b)=>s + b.prixAchat + b.coutsEngraissement, 0);
        const alimMois = alimentations.filter((a)=>monthKey(a.date) === m.key);
        const sacsConsommes = alimMois.reduce((s, a)=>s + a.quantite, 0);
        const coutAlimentation = alimMois.reduce((s, a)=>s + a.coutTotal, 0);
        const ca = ventesMois.reduce((s, b)=>s + b.prixVente, 0);
        const coutAchat = ventesMois.reduce((s, b)=>s + b.prixAchat, 0);
        const coutEngraissement = ventesMois.reduce((s, b)=>s + b.coutsEngraissement + b.autresCouts, 0);
        const margeTotale = ca - coutAchat - coutEngraissement;
        const coutAlimParTete = bovinsActifsMois.length > 0 ? coutAlimentation / bovinsActifsMois.length : 0;
        const margeParTete = ventesMois.length > 0 ? margeTotale / ventesMois.length : 0;
        const financementUtilise = echeancesPayees.filter((e)=>e.datePayee && new Date(e.datePayee) <= endOfMonth).reduce((s, e)=>s + e.montant, 0);
        const tauxUtilisation = montantFinance > 0 ? financementUtilise / montantFinance * 100 : 0;
        const caCumulMois = bovins.filter((b)=>b.statut === "VENDU" && b.dateVente && new Date(b.dateVente) <= endOfMonth).reduce((s, b)=>s + b.prixVente, 0);
        const coutsCumulMois = bovins.filter((b)=>b.dateAchat && new Date(b.dateAchat) <= endOfMonth).reduce((s, b)=>s + b.prixAchat + b.coutsEngraissement + b.autresCouts, 0);
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
            tauxUtilisation
        };
    });
    const dernier = monthly[monthly.length - 1];
    const caCumul = monthly.reduce((s, m)=>s + m.ca, 0);
    const margeCumul = monthly.reduce((s, m)=>s + m.margeTotale, 0);
    const ventesCumul = monthly.reduce((s, m)=>s + m.ventes, 0);
    const costStructure = {
        achatBovins: monthly.reduce((s, m)=>s + m.coutAchat, 0),
        alimentation: monthly.reduce((s, m)=>s + m.coutAlimentation, 0),
        engraissement: monthly.reduce((s, m)=>s + m.coutEngraissement, 0)
    };
    const rapport = {
        kpis: {
            bovinsActifs: dernier?.bovinsActifs ?? 0,
            caCumul,
            margeTotale: margeCumul,
            margeParTete: ventesCumul > 0 ? margeCumul / ventesCumul : 0,
            tauxUtilisation: dernier?.tauxUtilisation ?? 0,
            tresorerie: dernier?.tresorerie ?? 0
        },
        monthly,
        costStructure,
        alertes: alertes.map(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$server$2d$mappers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toAlerte"])
    };
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(rapport);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__dc755da4._.js.map