// Helpers de formatage — Application Élevage Bovin (SAVERDEV)

/** Formate un montant en FCFA avec séparateurs de milliers. */
export function formatFCFA(value: number | null | undefined, withSymbol = true): string {
  if (value == null || isNaN(value)) value = 0;
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(value);
  return withSymbol ? `${formatted} FCFA` : formatted;
}

/** Formate court : 1,2 M FCFA ou 450 k FCFA pour grandes valeurs. */
export function formatFCFAShort(value: number | null | undefined): string {
  if (value == null || isNaN(value)) value = 0;
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)} M FCFA`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${Math.round(value / 1000)} k FCFA`;
  }
  return `${value} FCFA`;
}

/** Formate une date ISO en JJ/MM/AAAA. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Formate une date ISO en "Janv. 2025" par exemple. */
export function formatMonthLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

/** Nom complet du mois en français. */
export function moisLabel(monthIndex: number): string {
  const noms = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  return noms[monthIndex] ?? "—";
}

/** Différence en jours entre deux dates. */
export function joursEntre(debut: string, fin: string | null = null): number {
  const d1 = new Date(debut).getTime();
  const d2 = fin ? new Date(fin).getTime() : Date.now();
  return Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
}

/** Couleur de badge selon statut échéance. */
export function statutEcheanceColor(s: string): string {
  switch (s) {
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

/** Couleur de badge selon statut bovin. */
export function statutBovinColor(s: string): string {
  switch (s) {
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

/** Couleur de badge selon sévérité d'alerte. */
export function severiteColor(s: string): string {
  switch (s) {
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

/** Génère le prochain identifiant BOV-XXX à partir d'une liste existante. */
export function nextBovinIdentifiant(existing: { identifiant: string }[]): string {
  let max = 0;
  for (const b of existing) {
    const m = /BOV-(\d+)/.exec(b.identifiant);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `BOV-${String(max + 1).padStart(3, "0")}`;
}

/**
 * Couleurs de graphiques SAVERDEV — valeurs hex directes (Recharts/SVG
 * ne résout pas var(--chart-X) dans les attributs stroke/fill).
 * Définies dans src/lib/config.ts (source de vérité unique).
 * Re-exportées ici pour compatibilité avec les imports existants.
 */
import { CHART_COLORS } from "@/lib/config";
export { CHART_COLORS };
