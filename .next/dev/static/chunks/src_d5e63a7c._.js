(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/store.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAppStore",
    ()=>useAppStore
]);
// Store Zustand — état global de l'app (rôle actif, vue courante, mois sélectionné, bovin sélectionné)
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
;
const currentMonthISO = ()=>{
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const useAppStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])((set)=>({
        role: "GERANT",
        view: "dashboard",
        selectedBovinId: null,
        selectedMonth: currentMonthISO(),
        setRole: (role)=>set((s)=>({
                    role,
                    // si la vue courante n'est pas accessible au nouveau rôle, fallback dashboard
                    view: rolePermissions(role).includes(s.view) ? s.view : "dashboard"
                })),
        setView: (view)=>set({
                view
            }),
        openBovin: (id)=>set({
                view: "fiche-bovin",
                selectedBovinId: id
            }),
        setSelectedMonth: (selectedMonth)=>set({
                selectedMonth
            })
    }));
// helper local (évite d'importer ROLE_VIEWS partout)
function rolePermissions(role) {
    const m = {
        ELEVEUR: [
            "dashboard",
            "bovins",
            "alimentation",
            "depenses",
            "ventes"
        ],
        GERANT: [
            "dashboard",
            "bovins",
            "alimentation",
            "depenses",
            "ventes",
            "rentabilite",
            "financement",
            "rapport"
        ],
        BAILLEUR: [
            "dashboard",
            "rentabilite",
            "financement",
            "rapport"
        ],
        ADMIN: [
            "dashboard",
            "bovins",
            "alimentation",
            "depenses",
            "ventes",
            "rentabilite",
            "financement",
            "rapport"
        ]
    };
    return m[role];
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/types.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Types partagés de l'application Élevage Bovin (SAVERDEV)
// Conçus pour matcher le schéma Prisma + besoins UI.
__turbopack_context__.s([
    "ROLE_DESCRIPTIONS",
    ()=>ROLE_DESCRIPTIONS,
    "ROLE_LABELS",
    ()=>ROLE_LABELS,
    "ROLE_VIEWS",
    ()=>ROLE_VIEWS
]);
const ROLE_LABELS = {
    ELEVEUR: "Éleveur",
    GERANT: "Gérant",
    BAILLEUR: "Bailleur",
    ADMIN: "Administrateur"
};
const ROLE_DESCRIPTIONS = {
    ELEVEUR: "Saisie et consultation des opérations quotidiennes",
    GERANT: "Saisie, validation, pilotage, reporting et administration",
    BAILLEUR: "Consultation des tableaux de bord et rapports (lecture seule)",
    ADMIN: "Administration technique et supervision"
};
const ROLE_VIEWS = {
    ELEVEUR: [
        "dashboard",
        "bovins",
        "fiche-bovin",
        "alimentation",
        "depenses",
        "ventes",
        "pesees"
    ],
    GERANT: [
        "carte-3d",
        "dashboard",
        "bovins",
        "fiche-bovin",
        "alimentation",
        "depenses",
        "ventes",
        "rentabilite",
        "financement",
        "rapport",
        "tresorerie",
        "pesees",
        "parametres",
        "paturages"
    ],
    BAILLEUR: [
        "bailleur-synthese",
        "financement",
        "rapport"
    ],
    ADMIN: [
        "carte-3d",
        "dashboard",
        "bovins",
        "fiche-bovin",
        "alimentation",
        "depenses",
        "ventes",
        "rentabilite",
        "financement",
        "rapport",
        "tresorerie",
        "pesees",
        "parametres",
        "paturages"
    ]
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAddTag",
    ()=>useAddTag,
    "useAlertes",
    ()=>useAlertes,
    "useAlimentations",
    ()=>useAlimentations,
    "useBackups",
    ()=>useBackups,
    "useBovin",
    ()=>useBovin,
    "useBovins",
    ()=>useBovins,
    "useCreateAlimentation",
    ()=>useCreateAlimentation,
    "useCreateBackup",
    ()=>useCreateBackup,
    "useCreateBovin",
    ()=>useCreateBovin,
    "useCreateDepense",
    ()=>useCreateDepense,
    "useCreatePese",
    ()=>useCreatePese,
    "useCreateSoin",
    ()=>useCreateSoin,
    "useCreateVente",
    ()=>useCreateVente,
    "useDashboard",
    ()=>useDashboard,
    "useDepenses",
    ()=>useDepenses,
    "useFinancement",
    ()=>useFinancement,
    "useHistorique",
    ()=>useHistorique,
    "useNotifications",
    ()=>useNotifications,
    "useParams",
    ()=>useParams,
    "usePaturages",
    ()=>usePaturages,
    "usePesees",
    ()=>usePesees,
    "useRapportBailleur",
    ()=>useRapportBailleur,
    "useSoins",
    ()=>useSoins,
    "useStatsComparaison",
    ()=>useStatsComparaison,
    "useStatsRaces",
    ()=>useStatsRaces,
    "useTags",
    ()=>useTags,
    "useTresorerie",
    ()=>useTresorerie,
    "useUpdateParam",
    ()=>useUpdateParam,
    "useValidateOperation",
    ()=>useValidateOperation,
    "useValidations",
    ()=>useValidations,
    "useVentes",
    ()=>useVentes
]);
// Hooks React (TanStack Query) — fetch les données depuis les API routes.
// Chaque hook expose { data, isLoading, error } et utilise des clés de cache stables.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/useMutation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature(), _s4 = __turbopack_context__.k.signature(), _s5 = __turbopack_context__.k.signature(), _s6 = __turbopack_context__.k.signature(), _s7 = __turbopack_context__.k.signature(), _s8 = __turbopack_context__.k.signature(), _s9 = __turbopack_context__.k.signature(), _s10 = __turbopack_context__.k.signature(), _s11 = __turbopack_context__.k.signature(), _s12 = __turbopack_context__.k.signature(), _s13 = __turbopack_context__.k.signature(), _s14 = __turbopack_context__.k.signature(), _s15 = __turbopack_context__.k.signature(), _s16 = __turbopack_context__.k.signature(), _s17 = __turbopack_context__.k.signature(), _s18 = __turbopack_context__.k.signature(), _s19 = __turbopack_context__.k.signature(), _s20 = __turbopack_context__.k.signature(), _s21 = __turbopack_context__.k.signature(), _s22 = __turbopack_context__.k.signature(), _s23 = __turbopack_context__.k.signature(), _s24 = __turbopack_context__.k.signature(), _s25 = __turbopack_context__.k.signature(), _s26 = __turbopack_context__.k.signature(), _s27 = __turbopack_context__.k.signature(), _s28 = __turbopack_context__.k.signature(), _s29 = __turbopack_context__.k.signature(), _s30 = __turbopack_context__.k.signature();
;
async function fetchJson(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`API ${url} → ${r.status}`);
    return r.json();
}
function useDashboard() {
    _s();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "dashboard"
        ],
        queryFn: {
            "useDashboard.useQuery": ()=>fetchJson("/api/dashboard")
        }["useDashboard.useQuery"]
    });
}
_s(useDashboard, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useBovins() {
    _s1();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "bovins"
        ],
        queryFn: {
            "useBovins.useQuery": ()=>fetchJson("/api/bovins")
        }["useBovins.useQuery"]
    });
}
_s1(useBovins, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useBovin(id) {
    _s2();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "bovin",
            id
        ],
        queryFn: {
            "useBovin.useQuery": ()=>fetchJson(`/api/bovins/${id}`)
        }["useBovin.useQuery"],
        enabled: !!id
    });
}
_s2(useBovin, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useCreateBovin() {
    _s3();
    const qc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"])({
        mutationFn: {
            "useCreateBovin.useMutation": async (data)=>{
                const r = await fetch("/api/bovins", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });
                if (!r.ok) throw new Error("Échec création bovin");
                return r.json();
            }
        }["useCreateBovin.useMutation"],
        onSuccess: {
            "useCreateBovin.useMutation": ()=>{
                qc.invalidateQueries({
                    queryKey: [
                        "bovins"
                    ]
                });
                qc.invalidateQueries({
                    queryKey: [
                        "dashboard"
                    ]
                });
                qc.invalidateQueries({
                    queryKey: [
                        "historique"
                    ]
                });
            }
        }["useCreateBovin.useMutation"]
    });
}
_s3(useCreateBovin, "ec0A66mtyLA0kdwNsMUsaWj/EHM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"]
    ];
});
function useAlimentations() {
    _s4();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "alimentation"
        ],
        queryFn: {
            "useAlimentations.useQuery": ()=>fetchJson("/api/alimentation")
        }["useAlimentations.useQuery"]
    });
}
_s4(useAlimentations, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useCreateAlimentation() {
    _s5();
    const qc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"])({
        mutationFn: {
            "useCreateAlimentation.useMutation": async (data)=>{
                const r = await fetch("/api/alimentation", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });
                if (!r.ok) throw new Error("Échec création alimentation");
                return r.json();
            }
        }["useCreateAlimentation.useMutation"],
        onSuccess: {
            "useCreateAlimentation.useMutation": ()=>{
                qc.invalidateQueries({
                    queryKey: [
                        "alimentation"
                    ]
                });
                qc.invalidateQueries({
                    queryKey: [
                        "bovins"
                    ]
                });
                qc.invalidateQueries({
                    queryKey: [
                        "dashboard"
                    ]
                });
                qc.invalidateQueries({
                    queryKey: [
                        "historique"
                    ]
                });
            }
        }["useCreateAlimentation.useMutation"]
    });
}
_s5(useCreateAlimentation, "ec0A66mtyLA0kdwNsMUsaWj/EHM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"]
    ];
});
function useDepenses() {
    _s6();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "depenses"
        ],
        queryFn: {
            "useDepenses.useQuery": ()=>fetchJson("/api/depenses")
        }["useDepenses.useQuery"]
    });
}
_s6(useDepenses, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useCreateDepense() {
    _s7();
    const qc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"])({
        mutationFn: {
            "useCreateDepense.useMutation": async (data)=>{
                const r = await fetch("/api/depenses", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });
                if (!r.ok) throw new Error("Échec création dépense");
                return r.json();
            }
        }["useCreateDepense.useMutation"],
        onSuccess: {
            "useCreateDepense.useMutation": ()=>{
                qc.invalidateQueries({
                    queryKey: [
                        "depenses"
                    ]
                });
                qc.invalidateQueries({
                    queryKey: [
                        "bovins"
                    ]
                });
                qc.invalidateQueries({
                    queryKey: [
                        "dashboard"
                    ]
                });
                qc.invalidateQueries({
                    queryKey: [
                        "historique"
                    ]
                });
            }
        }["useCreateDepense.useMutation"]
    });
}
_s7(useCreateDepense, "ec0A66mtyLA0kdwNsMUsaWj/EHM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"]
    ];
});
function useVentes() {
    _s8();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "ventes"
        ],
        queryFn: {
            "useVentes.useQuery": ()=>fetchJson("/api/ventes")
        }["useVentes.useQuery"]
    });
}
_s8(useVentes, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useCreateVente() {
    _s9();
    const qc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"])({
        mutationFn: {
            "useCreateVente.useMutation": async (data)=>{
                const r = await fetch("/api/ventes", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });
                if (!r.ok) throw new Error("Échec enregistrement vente");
                return r.json();
            }
        }["useCreateVente.useMutation"],
        onSuccess: {
            "useCreateVente.useMutation": ()=>{
                qc.invalidateQueries({
                    queryKey: [
                        "ventes"
                    ]
                });
                qc.invalidateQueries({
                    queryKey: [
                        "bovins"
                    ]
                });
                qc.invalidateQueries({
                    queryKey: [
                        "dashboard"
                    ]
                });
                qc.invalidateQueries({
                    queryKey: [
                        "historique"
                    ]
                });
            }
        }["useCreateVente.useMutation"]
    });
}
_s9(useCreateVente, "ec0A66mtyLA0kdwNsMUsaWj/EHM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"]
    ];
});
function useFinancement() {
    _s10();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "financement"
        ],
        queryFn: {
            "useFinancement.useQuery": ()=>fetchJson("/api/financement")
        }["useFinancement.useQuery"]
    });
}
_s10(useFinancement, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useAlertes() {
    _s11();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "alertes"
        ],
        queryFn: {
            "useAlertes.useQuery": ()=>fetchJson("/api/alertes")
        }["useAlertes.useQuery"]
    });
}
_s11(useAlertes, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useHistorique() {
    _s12();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "historique"
        ],
        queryFn: {
            "useHistorique.useQuery": ()=>fetchJson("/api/historique")
        }["useHistorique.useQuery"]
    });
}
_s12(useHistorique, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useTresorerie() {
    _s13();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "tresorerie"
        ],
        queryFn: {
            "useTresorerie.useQuery": ()=>fetchJson("/api/tresorerie")
        }["useTresorerie.useQuery"]
    });
}
_s13(useTresorerie, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function usePesees(bovinId) {
    _s14();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "pesees",
            bovinId
        ],
        queryFn: {
            "usePesees.useQuery": ()=>fetchJson(`/api/pesees${bovinId ? `?bovinId=${bovinId}` : ""}`)
        }["usePesees.useQuery"]
    });
}
_s14(usePesees, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useCreatePese() {
    _s15();
    const qc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"])({
        mutationFn: {
            "useCreatePese.useMutation": async (data)=>{
                const r = await fetch("/api/pesees", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });
                if (!r.ok) throw new Error("Échec");
                return r.json();
            }
        }["useCreatePese.useMutation"],
        onSuccess: {
            "useCreatePese.useMutation": ()=>{
                qc.invalidateQueries({
                    queryKey: [
                        "pesees"
                    ]
                });
                qc.invalidateQueries({
                    queryKey: [
                        "dashboard"
                    ]
                });
            }
        }["useCreatePese.useMutation"]
    });
}
_s15(useCreatePese, "ec0A66mtyLA0kdwNsMUsaWj/EHM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"]
    ];
});
function useParams() {
    _s16();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "parametres"
        ],
        queryFn: {
            "useParams.useQuery": ()=>fetchJson("/api/parametres")
        }["useParams.useQuery"]
    });
}
_s16(useParams, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useUpdateParam() {
    _s17();
    const qc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"])({
        mutationFn: {
            "useUpdateParam.useMutation": async (data)=>{
                const r = await fetch("/api/parametres", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });
                if (!r.ok) throw new Error("Échec");
                return r.json();
            }
        }["useUpdateParam.useMutation"],
        onSuccess: {
            "useUpdateParam.useMutation": ()=>qc.invalidateQueries({
                    queryKey: [
                        "parametres"
                    ]
                })
        }["useUpdateParam.useMutation"]
    });
}
_s17(useUpdateParam, "ec0A66mtyLA0kdwNsMUsaWj/EHM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"]
    ];
});
function useNotifications() {
    _s18();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "notifications"
        ],
        queryFn: {
            "useNotifications.useQuery": ()=>fetchJson("/api/notifications")
        }["useNotifications.useQuery"]
    });
}
_s18(useNotifications, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useBackups() {
    _s19();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "backups"
        ],
        queryFn: {
            "useBackups.useQuery": ()=>fetchJson("/api/backup")
        }["useBackups.useQuery"]
    });
}
_s19(useBackups, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useCreateBackup() {
    _s20();
    const qc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"])({
        mutationFn: {
            "useCreateBackup.useMutation": async ()=>{
                const r = await fetch("/api/backup", {
                    method: "POST"
                });
                if (!r.ok) throw new Error("Échec");
                return r.json();
            }
        }["useCreateBackup.useMutation"],
        onSuccess: {
            "useCreateBackup.useMutation": ()=>qc.invalidateQueries({
                    queryKey: [
                        "backups"
                    ]
                })
        }["useCreateBackup.useMutation"]
    });
}
_s20(useCreateBackup, "ec0A66mtyLA0kdwNsMUsaWj/EHM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"]
    ];
});
function useSoins(bovinId) {
    _s21();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "soins",
            bovinId
        ],
        queryFn: {
            "useSoins.useQuery": ()=>fetchJson(`/api/soins${bovinId ? `?bovinId=${bovinId}` : ""}`)
        }["useSoins.useQuery"]
    });
}
_s21(useSoins, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useCreateSoin() {
    _s22();
    const qc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"])({
        mutationFn: {
            "useCreateSoin.useMutation": async (data)=>{
                const r = await fetch("/api/soins", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });
                if (!r.ok) throw new Error("Échec");
                return r.json();
            }
        }["useCreateSoin.useMutation"],
        onSuccess: {
            "useCreateSoin.useMutation": ()=>{
                qc.invalidateQueries({
                    queryKey: [
                        "soins"
                    ]
                });
                qc.invalidateQueries({
                    queryKey: [
                        "dashboard"
                    ]
                });
            }
        }["useCreateSoin.useMutation"]
    });
}
_s22(useCreateSoin, "ec0A66mtyLA0kdwNsMUsaWj/EHM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"]
    ];
});
function useStatsRaces() {
    _s23();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "stats-races"
        ],
        queryFn: {
            "useStatsRaces.useQuery": ()=>fetchJson("/api/stats/races")
        }["useStatsRaces.useQuery"]
    });
}
_s23(useStatsRaces, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useStatsComparaison() {
    _s24();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "stats-comparaison"
        ],
        queryFn: {
            "useStatsComparaison.useQuery": ()=>fetchJson("/api/stats/comparaison")
        }["useStatsComparaison.useQuery"]
    });
}
_s24(useStatsComparaison, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function usePaturages() {
    _s25();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "paturages"
        ],
        queryFn: {
            "usePaturages.useQuery": ()=>fetchJson("/api/paturages")
        }["usePaturages.useQuery"]
    });
}
_s25(usePaturages, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useTags(bovinId) {
    _s26();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "tags",
            bovinId
        ],
        queryFn: {
            "useTags.useQuery": ()=>fetchJson(`/api/bovins/${bovinId}/tags`)
        }["useTags.useQuery"],
        enabled: !!bovinId
    });
}
_s26(useTags, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useAddTag() {
    _s27();
    const qc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"])({
        mutationFn: {
            "useAddTag.useMutation": async (data)=>{
                const r = await fetch(`/api/bovins/${data.bovinId}/tags`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });
                if (!r.ok) throw new Error("Échec");
                return r.json();
            }
        }["useAddTag.useMutation"],
        onSuccess: {
            "useAddTag.useMutation": (_, data)=>{
                qc.invalidateQueries({
                    queryKey: [
                        "tags",
                        data.bovinId
                    ]
                });
            }
        }["useAddTag.useMutation"]
    });
}
_s27(useAddTag, "ec0A66mtyLA0kdwNsMUsaWj/EHM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"]
    ];
});
function useValidations() {
    _s28();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "validations"
        ],
        queryFn: {
            "useValidations.useQuery": ()=>fetchJson("/api/validations")
        }["useValidations.useQuery"]
    });
}
_s28(useValidations, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useValidateOperation() {
    _s29();
    const qc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"])({
        mutationFn: {
            "useValidateOperation.useMutation": async (data)=>{
                const r = await fetch(`/api/validations/${data.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });
                if (!r.ok) throw new Error("Échec");
                return r.json();
            }
        }["useValidateOperation.useMutation"],
        onSuccess: {
            "useValidateOperation.useMutation": ()=>{
                qc.invalidateQueries({
                    queryKey: [
                        "validations"
                    ]
                });
                qc.invalidateQueries({
                    queryKey: [
                        "dashboard"
                    ]
                });
            }
        }["useValidateOperation.useMutation"]
    });
}
_s29(useValidateOperation, "ec0A66mtyLA0kdwNsMUsaWj/EHM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQueryClient"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useMutation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMutation"]
    ];
});
function useRapportBailleur(annee) {
    _s30();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            "rapport-bailleur",
            annee
        ],
        queryFn: {
            "useRapportBailleur.useQuery": ()=>fetchJson(`/api/rapport-bailleur${annee ? `?annee=${annee}` : ""}`)
        }["useRapportBailleur.useQuery"]
    });
}
_s30(useRapportBailleur, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/config.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CHART_COLORS",
    ()=>CHART_COLORS,
    "CHEPTEL_DONUT_COLORS",
    ()=>CHEPTEL_DONUT_COLORS,
    "COST_STRUCTURE_COLORS",
    ()=>COST_STRUCTURE_COLORS,
    "NAV_ITEMS",
    ()=>NAV_ITEMS,
    "PALETTE",
    ()=>PALETTE,
    "RAPPORT_KPI_COLORS",
    ()=>RAPPORT_KPI_COLORS,
    "ROLE_DESCRIPTIONS",
    ()=>ROLE_DESCRIPTIONS,
    "ROLE_LABELS",
    ()=>ROLE_LABELS,
    "SEVERITE_LABELS",
    ()=>SEVERITE_LABELS,
    "STATUT_BOVIN_LABELS",
    ()=>STATUT_BOVIN_LABELS,
    "STATUT_ECHEANCE_LABELS",
    ()=>STATUT_ECHEANCE_LABELS
]);
// Configuration centralisée SAVERDEV — palette, icônes, labels.
// Source de vérité unique pour les couleurs, les icônes de navigation et
// les labels utilisés dans toute l'application.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/activity.js [app-client] (ecmascript) <export default as Activity>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/database.js [app-client] (ecmascript) <export default as Database>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/package.js [app-client] (ecmascript) <export default as Package>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/credit-card.js [app-client] (ecmascript) <export default as CreditCard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trending-up.js [app-client] (ecmascript) <export default as TrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chart-column.js [app-client] (ecmascript) <export default as BarChart3>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/clock.js [app-client] (ecmascript) <export default as Clock>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-text.js [app-client] (ecmascript) <export default as FileText>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$box$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Box$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/box.js [app-client] (ecmascript) <export default as Box>");
;
const PALETTE = {
    // Primary — vert forêt SAVERDEV
    primary: "#10B981",
    primaryLight: "#34D399",
    primaryDark: "#059669",
    // Secondary — teal
    secondary: "#14B8A6",
    secondaryLight: "#5EEAD4",
    // Accents
    emerald: "#10B981",
    teal: "#14B8A6",
    greenLight: "#34D399",
    greenPale: "#6EE7B7",
    // Sémantique
    amber: "#F59E0B",
    red: "#EF4444",
    slate: "#94A3B8",
    // Sidebar
    sidebarDark: "#0F172A",
    sidebarAccent: "#1E293B",
    // Fond / surfaces
    background: "#F3F4F6",
    card: "#FFFFFF",
    border: "#E5E7EB",
    muted: "#F9FAFB"
};
const CHART_COLORS = {
    vertForet: PALETTE.primary,
    marronTerre: PALETTE.secondary,
    vertClair: PALETTE.greenLight,
    bleuCiel: PALETTE.greenLight,
    ocreSahel: PALETTE.amber,
    rougeTerre: PALETTE.red
};
const RAPPORT_KPI_COLORS = {
    bovinsActifs: "#1E7B34",
    ca: "#1E6091",
    marge: "#14532A",
    margeParTete: "#0F766E",
    tauxUtil: "#E0A008",
    tresorerie: "#8D6E63"
};
const COST_STRUCTURE_COLORS = {
    achatBovin: PALETTE.amber,
    alimentation: PALETTE.primary,
    autresCouts: "#3B82F6"
};
const CHEPTEL_DONUT_COLORS = {
    enEngraissement: PALETTE.primary,
    vendus: "#8B5CF6",
    mortalite: PALETTE.red
};
const NAV_ITEMS = [
    {
        key: "dashboard",
        label: "Tableau de bord",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$activity$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Activity$3e$__["Activity"]
    },
    {
        key: "bovins",
        label: "Bovins",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$database$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Database$3e$__["Database"]
    },
    {
        key: "alimentation",
        label: "Alimentation",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__["Package"]
    },
    {
        key: "depenses",
        label: "Dépenses",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$credit$2d$card$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CreditCard$3e$__["CreditCard"]
    },
    {
        key: "ventes",
        label: "Ventes",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trending$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__TrendingUp$3e$__["TrendingUp"]
    },
    {
        key: "rentabilite",
        label: "Rentabilité",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chart$2d$column$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarChart3$3e$__["BarChart3"]
    },
    {
        key: "financement",
        label: "Financement",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$clock$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Clock$3e$__["Clock"]
    },
    {
        key: "rapport",
        label: "Rapport bailleur",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$text$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileText$3e$__["FileText"]
    },
    {
        key: "carte-3d",
        label: "Carte 3D",
        icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$box$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Box$3e$__["Box"]
    }
];
const ROLE_LABELS = {
    ELEVEUR: "Éleveur",
    GERANT: "Gérant",
    BAILLEUR: "Bailleur",
    ADMIN: "Administrateur"
};
const ROLE_DESCRIPTIONS = {
    ELEVEUR: "Saisie et consultation des opérations quotidiennes",
    GERANT: "Saisie, validation, pilotage, reporting et administration",
    BAILLEUR: "Consultation des tableaux de bord et rapports (lecture seule)",
    ADMIN: "Administration technique et supervision"
};
const STATUT_BOVIN_LABELS = {
    EN_ENGRAISSEMENT: "En engraissement",
    VENDU: "Vendu",
    MORT: "Mort"
};
const STATUT_ECHEANCE_LABELS = {
    PAYEE: "Payée",
    A_PAYER: "À payer",
    EN_RETARD: "En retard"
};
const SEVERITE_LABELS = {
    INFO: "Info",
    WARNING: "Attention",
    CRITICAL: "Critique"
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/format.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

// Helpers de formatage — Application Élevage Bovin (SAVERDEV)
/** Formate un montant en FCFA avec séparateurs de milliers. */ __turbopack_context__.s([
    "formatDate",
    ()=>formatDate,
    "formatFCFA",
    ()=>formatFCFA,
    "formatFCFAShort",
    ()=>formatFCFAShort,
    "formatMonthLabel",
    ()=>formatMonthLabel,
    "joursEntre",
    ()=>joursEntre,
    "moisLabel",
    ()=>moisLabel,
    "nextBovinIdentifiant",
    ()=>nextBovinIdentifiant,
    "severiteColor",
    ()=>severiteColor,
    "statutBovinColor",
    ()=>statutBovinColor,
    "statutEcheanceColor",
    ()=>statutEcheanceColor
]);
/**
 * Couleurs de graphiques SAVERDEV — valeurs hex directes (Recharts/SVG
 * ne résout pas var(--chart-X) dans les attributs stroke/fill).
 * Définies dans src/lib/config.ts (source de vérité unique).
 * Re-exportées ici pour compatibilité avec les imports existants.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/config.ts [app-client] (ecmascript)");
function formatFCFA(value, withSymbol = true) {
    if (value == null || isNaN(value)) value = 0;
    const formatted = new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 0
    }).format(value);
    return withSymbol ? `${formatted} FCFA` : formatted;
}
function formatFCFAShort(value) {
    if (value == null || isNaN(value)) value = 0;
    if (Math.abs(value) >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)} M FCFA`;
    }
    if (Math.abs(value) >= 1_000) {
        return `${Math.round(value / 1000)} k FCFA`;
    }
    return `${value} FCFA`;
}
function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}
function formatMonthLabel(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric"
    });
}
function moisLabel(monthIndex) {
    const noms = [
        "Janvier",
        "Février",
        "Mars",
        "Avril",
        "Mai",
        "Juin",
        "Juillet",
        "Août",
        "Septembre",
        "Octobre",
        "Novembre",
        "Décembre"
    ];
    return noms[monthIndex] ?? "—";
}
function joursEntre(debut, fin = null) {
    const d1 = new Date(debut).getTime();
    const d2 = fin ? new Date(fin).getTime() : Date.now();
    return Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
}
function statutEcheanceColor(s) {
    switch(s){
        case "PAYEE":
            return "text-emerald-700 bg-emerald-100 border-emerald-200";
        case "A_PAYER":
            return "text-amber-700 bg-amber-100 border-amber-200";
        case "EN_RETARD":
            return "text-red-700 bg-red-100 border-red-200";
        default:
            return "text-muted-foreground bg-muted border-border";
    }
}
function statutBovinColor(s) {
    switch(s){
        case "EN_ENGRAISSEMENT":
            return "text-primary bg-primary/10 border-primary/20";
        case "VENDU":
            return "text-emerald-700 bg-emerald-50 border-emerald-200";
        case "MORT":
            return "text-red-700 bg-red-50 border-red-200";
        default:
            return "text-muted-foreground bg-muted border-border";
    }
}
function severiteColor(s) {
    switch(s){
        case "INFO":
            return "text-sky-700 bg-sky-50 border-sky-200";
        case "WARNING":
            return "text-amber-700 bg-amber-50 border-amber-200";
        case "CRITICAL":
            return "text-red-700 bg-red-50 border-red-200";
        default:
            return "text-muted-foreground bg-muted border-border";
    }
}
function nextBovinIdentifiant(existing) {
    let max = 0;
    for (const b of existing){
        const m = /BOV-(\d+)/.exec(b.identifiant);
        if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `BOV-${String(max + 1).padStart(3, "0")}`;
}
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/calculations.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/export.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Helpers d'export — CSV (universel, Excel/Sheets/LibreOffice compatibles).
__turbopack_context__.s([
    "downloadFile",
    ()=>downloadFile,
    "exportCSV",
    ()=>exportCSV,
    "toCSV",
    ()=>toCSV
]);
function toCSV(rows, columns) {
    const escape = (v)=>{
        if (v == null) return "";
        const s = String(v);
        if (/[;"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
    };
    const header = columns.map((c)=>escape(c.label)).join(";");
    const body = rows.map((row)=>columns.map((c)=>escape(row[c.key])).join(";")).join("\n");
    return "\uFEFF" + header + "\n" + body;
}
function downloadFile(content, filename, mimeType = "text/csv;charset=utf-8") {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const blob = new Blob([
        content
    ], {
        type: mimeType
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
function exportCSV(rows, columns, filename) {
    downloadFile(toCSV(rows, columns), filename);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/hooks/use-mobile.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useIsMobile",
    ()=>useIsMobile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
const MOBILE_BREAKPOINT = 768;
function useIsMobile() {
    _s();
    const [isMobile, setIsMobile] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](undefined);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"]({
        "useIsMobile.useEffect": ()=>{
            const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
            const onChange = {
                "useIsMobile.useEffect.onChange": ()=>{
                    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
                }
            }["useIsMobile.useEffect.onChange"];
            mql.addEventListener("change", onChange);
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
            return ({
                "useIsMobile.useEffect": ()=>mql.removeEventListener("change", onChange)
            })["useIsMobile.useEffect"];
        }
    }["useIsMobile.useEffect"], []);
    return !!isMobile;
}
_s(useIsMobile, "D6B2cPXNCaIbeOx+abFr1uxLRM0=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
// Shell principal de l'application SAVERDEV Élevage Bovin.
// Routeur de vues par état local (Zustand) — pas de routing Next.js (single page).
// Rôles : Éleveur / Gérant / Bailleur (lecture seule) / Admin.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/store.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/types.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$app$2f$app$2d$sidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/app/app-sidebar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$app$2f$app$2d$header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/app/app-header.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$app$2f$app$2d$footer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/app/app-footer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$dashboard$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/dashboard-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$bovins$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/bovins-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$fiche$2d$bovin$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/fiche-bovin-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$alimentation$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/alimentation-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$depenses$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/depenses-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$ventes$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/ventes-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$rentabilite$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/rentabilite-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$financement$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/financement-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$tresorerie$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/tresorerie-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$pesees$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/pesees-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$parametres$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/parametres-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$paturages$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/paturages-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$rapport$2d$bailleur$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/rapport-bailleur-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$bailleur$2d$synthese$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/bailleur-synthese-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$carte$2d$3d$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/views/carte-3d-view.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
const VIEW_TITLES = {
    dashboard: "Tableau de bord",
    bovins: "Cheptel — Bovins",
    "fiche-bovin": "Fiche bovin",
    alimentation: "Alimentation",
    depenses: "Dépenses d'exploitation",
    ventes: "Ventes & sorties",
    rentabilite: "Rentabilité",
    financement: "Financement & Bailleur",
    tresorerie: "Prévisions de trésorerie",
    pesees: "Pesées connectées",
    parametres: "Paramètres & seuils",
    paturages: "Pâturages",
    rapport: "Rapport bailleur",
    "bailleur-synthese": "Synthèse bailleur",
    "carte-3d": "Carte 3D — Exploitation"
};
const VIEW_COMPONENTS = {
    dashboard: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$dashboard$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DashboardView"],
    bovins: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$bovins$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BovinsView"],
    "fiche-bovin": __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$fiche$2d$bovin$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FicheBovinView"],
    alimentation: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$alimentation$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlimentationView"],
    depenses: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$depenses$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DepensesView"],
    ventes: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$ventes$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VentesView"],
    rentabilite: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$rentabilite$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RentabiliteView"],
    financement: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$financement$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FinancementView"],
    tresorerie: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$tresorerie$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TresorerieView"],
    pesees: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$pesees$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PeseesView"],
    parametres: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$parametres$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ParametresView"],
    paturages: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$paturages$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PaturagesView"],
    rapport: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$rapport$2d$bailleur$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RapportBailleurView"],
    "bailleur-synthese": __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$bailleur$2d$synthese$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BailleurSyntheseView"],
    "carte-3d": __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$views$2f$carte$2d$3d$2d$view$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Carte3DView"]
};
function Home() {
    _s();
    const role = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppStore"])({
        "Home.useAppStore[role]": (s)=>s.role
    }["Home.useAppStore[role]"]);
    const view = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppStore"])({
        "Home.useAppStore[view]": (s)=>s.view
    }["Home.useAppStore[view]"]);
    const selectedBovinId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppStore"])({
        "Home.useAppStore[selectedBovinId]": (s)=>s.selectedBovinId
    }["Home.useAppStore[selectedBovinId]"]);
    const allowedViews = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ROLE_VIEWS"][role];
    const effectiveView = allowedViews.includes(view) ? view : allowedViews[0] ?? "dashboard";
    const ViewComponent = VIEW_COMPONENTS[effectiveView];
    const subtitle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Home.useMemo[subtitle]": ()=>{
            if (effectiveView === "fiche-bovin" && selectedBovinId) return selectedBovinId;
            return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$types$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ROLE_DESCRIPTIONS"][role];
        }
    }["Home.useMemo[subtitle]"], [
        effectiveView,
        selectedBovinId,
        role
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen flex flex-col bg-background gradient-mesh",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$app$2f$app$2d$header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AppHeader"], {
                title: VIEW_TITLES[effectiveView],
                subtitle: subtitle
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 83,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-1 w-full",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$app$2f$app$2d$sidebar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AppSidebar"], {
                        activeView: effectiveView,
                        role: role
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 85,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "flex-1 min-w-0 overflow-x-hidden",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                                mode: "wait",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                                    initial: {
                                        opacity: 0,
                                        y: 12,
                                        filter: "blur(4px)"
                                    },
                                    animate: {
                                        opacity: 1,
                                        y: 0,
                                        filter: "blur(0px)"
                                    },
                                    exit: {
                                        opacity: 0,
                                        y: -8,
                                        filter: "blur(2px)"
                                    },
                                    transition: {
                                        duration: 0.35,
                                        ease: [
                                            0.22,
                                            1,
                                            0.36,
                                            1
                                        ]
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ViewComponent, {}, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 96,
                                        columnNumber: 17
                                    }, this)
                                }, effectiveView, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 89,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 88,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 87,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 86,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 84,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$app$2f$app$2d$footer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AppFooter"], {}, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 102,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 82,
        columnNumber: 5
    }, this);
}
_s(Home, "F+3b+KM4S/Fq+kWcITgxCHNVGOs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$store$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAppStore"]
    ];
});
_c = Home;
var _c;
__turbopack_context__.k.register(_c, "Home");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_d5e63a7c._.js.map