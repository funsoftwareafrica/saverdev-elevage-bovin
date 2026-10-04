// Configuration centralisée SAVERDEV — palette, icônes, labels.
// Source de vérité unique pour les couleurs, les icônes de navigation et
// les labels utilisés dans toute l'application.

import type { IconSvgElement } from "@hugeicons/react";
import {
  Activity, Database, Package, CreditCard, TrendingUp, BarChart3,
  Clock, FileText, Box,
} from "@/lib/icons";
import type { ViewKey } from "@/lib/types";

// ============================================================
//   PALETTE SAVERDEV — hexadécimaux (variables CSS dans globals.css)
//   Utiliser ces constantes pour les attributs SVG (stroke/fill)
//   qui ne résolvent pas var(--chart-X).
// ============================================================

export const PALETTE = {
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
  amber: "#F59E0B",     // attention / warning
  red: "#EF4444",       // destructive / alerte
  slate: "#94A3B8",     // neutre / vendu

  // Sidebar
  sidebarDark: "#0F172A",
  sidebarAccent: "#1E293B",

  // Fond / surfaces
  background: "#F3F4F6",
  card: "#FFFFFF",
  border: "#E5E7EB",
  muted: "#F9FAFB",
} as const;

// ============================================================
//   COULEURS GRAPHIQUES (Recharts / SVG)
//   Mappe sur --chart-1..5 + --destructive de globals.css.
// ============================================================

export const CHART_COLORS = {
  vertForet: PALETTE.primary,    // chart-1
  marronTerre: PALETTE.secondary, // chart-2 (teal)
  vertClair: PALETTE.greenLight, // chart-3
  bleuCiel: PALETTE.greenLight,  // chart-4
  ocreSahel: PALETTE.amber,      // chart-5
  rougeTerre: PALETTE.red,       // destructive
} as const;

// ============================================================
//   COULEURS MODÈLE EXCEL E2A (rapport bailleur)
//   Couleurs exactes extraites du fichier Excel de référence.
// ============================================================

export const RAPPORT_KPI_COLORS = {
  bovinsActifs: "#1E7B34",   // vert
  ca: "#1E6091",             // bleu
  marge: "#14532A",          // vert foncé
  margeParTete: "#0F766E",   // teal
  tauxUtil: "#E0A008",       // ambre/or
  tresorerie: "#8D6E63",     // marron
} as const;

// Couleurs de la ventilation des coûts (modèle Excel)
export const COST_STRUCTURE_COLORS = {
  achatBovin: PALETTE.amber,    // orange — achat de bovin
  alimentation: PALETTE.primary, // vert — alimentation
  autresCouts: "#3B82F6",       // bleu — autres coûts
} as const;

// Couleurs du donut "Répartition du cheptel"
export const CHEPTEL_DONUT_COLORS = {
  enEngraissement: PALETTE.primary,  // vert
  vendus: "#8B5CF6",                  // violet (distinct du vert)
  mortalite: PALETTE.red,             // rouge
} as const;

// ============================================================
//   NAVIGATION — items de la sidebar (icône + label par vue)
// ============================================================

export interface NavItem {
  key: ViewKey;
  label: string;
  icon: IconSvgElement;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Tableau de bord", icon: Activity },
  { key: "bovins", label: "Bovins", icon: Database },
  { key: "alimentation", label: "Alimentation", icon: Package },
  { key: "depenses", label: "Dépenses", icon: CreditCard },
  { key: "ventes", label: "Ventes", icon: TrendingUp },
  { key: "rentabilite", label: "Rentabilité", icon: BarChart3 },
  { key: "financement", label: "Financement", icon: Clock },
  { key: "rapport", label: "Rapport bailleur", icon: FileText },
  { key: "carte-3d", label: "Carte 3D", icon: Box },
];

// ============================================================
//   LABELS — rôles, statuts, sources
// ============================================================

export const ROLE_LABELS = {
  ELEVEUR: "Éleveur",
  GERANT: "Gérant",
  BAILLEUR: "Bailleur",
  ADMIN: "Administrateur",
} as const;

export const ROLE_DESCRIPTIONS = {
  ELEVEUR: "Saisie et consultation des opérations quotidiennes",
  GERANT: "Saisie, validation, pilotage, reporting et administration",
  BAILLEUR: "Consultation des tableaux de bord et rapports (lecture seule)",
  ADMIN: "Administration technique et supervision",
} as const;

export const STATUT_BOVIN_LABELS = {
  EN_ENGRAISSEMENT: "En engraissement",
  VENDU: "Vendu",
  MORT: "Mort",
} as const;

export const STATUT_ECHEANCE_LABELS = {
  PAYEE: "Payée",
  A_PAYER: "À payer",
  EN_RETARD: "En retard",
} as const;

export const SEVERITE_LABELS = {
  INFO: "Info",
  WARNING: "Attention",
  CRITICAL: "Critique",
} as const;
