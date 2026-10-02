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
"[project]/src/app/api/historique/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
// GET /api/historique — journal des opérations
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$server$2d$mappers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/server-mappers.ts [app-route] (ecmascript)");
;
;
;
async function GET() {
    const historique = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].historique.findMany({
        include: {
            user: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            date: "desc"
        },
        take: 50
    });
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(historique.map(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$server$2d$mappers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHistorique"]));
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__7d61f6c3._.js.map