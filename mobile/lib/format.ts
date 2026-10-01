// Format helpers — identique au web mais avec retour d'objet pour RN
export function formatFCFA(v: number | null | undefined, withSymbol = true): string {
  if (v == null || isNaN(v)) v = 0;
  const f = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v);
  return withSymbol ? `${f} FCFA` : f;
}
export function formatFCFAShort(v: number | null | undefined): string {
  if (v == null || isNaN(v)) v = 0;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M`;
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1000)} k`;
  return `${v}`;
}
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
export function statutBovinColor(s: string): { bg: string; fg: string; border: string } {
  switch (s) {
    case "EN_ENGRAISSEMENT": return { bg: "#D1FAE5", fg: "#065F46", border: "#A7F3D0" };
    case "VENDU": return { bg: "#D1FAE5", fg: "#047857", border: "#A7F3D0" };
    case "MORT": return { bg: "#FEE2E2", fg: "#991B1B", border: "#FECACA" };
    default: return { bg: "#F3F4F6", fg: "#6B7280", border: "#E5E7EB" };
  }
}
