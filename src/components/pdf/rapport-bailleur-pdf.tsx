// Composant PDF du rapport bailleur — généré via @react-pdf/renderer.
//
// Structure (5 pages) :
//   Page 1 — Couverture : logo SAVERDEV + titre "Rapport Bailleur" + date
//   Page 2 — 6 KPI + résumé
//   Page 3 — Section A : Balance comptable
//   Page 4 — Section B : Suivi du financement (capital + mouvements)
//            + Section C : Suivi budgétaire
//   Page 5 — Section D : Dépenses d'investissement + Annexe mensuelle
//
// On évite les dépendances externes (pas de fetch de polices) en utilisant
// les primitives PDF natives (Helvetica, Times-Roman) qui sont toujours
// disponibles dans PDF.js et n'ont pas besoin de chargement réseau.

import {
  Document, Page, View, Text, StyleSheet, Font, renderToStream,
} from "@react-pdf/renderer";
import type {
  RapportBailleur, BalanceLigne, BudgetSection, BudgetLigne, CapitalMouvementItem,
} from "@/lib/types";

// ============================================================
//  Helpers de formatage (PDF — Intl dispo côté serveur Node)
// ============================================================

function formatFCFAPdf(value: number | null | undefined, withSymbol = true): string {
  if (value == null || isNaN(value)) value = 0;
  const formatted = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
  return withSymbol ? `${formatted} FCFA` : formatted;
}

function formatFCFAShortPdg(value: number | null | undefined): string {
  if (value == null || isNaN(value)) value = 0;
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)} M FCFA`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${Math.round(value / 1000)} k FCFA`;
  }
  return `${value} FCFA`;
}

function formatDatePdg(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// ============================================================
//  Styles PDF — palette SAVERDEV (vert forêt + marron terre + blanc)
// ============================================================

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1F2937",
    padding: 32,
    paddingBottom: 48,
    backgroundColor: "#FFFFFF",
  },
  coverPage: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1F2937",
    padding: 0,
    backgroundColor: "#FFFFFF",
    flexDirection: "column",
  },
  coverTop: {
    backgroundColor: "#14532A",
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 40,
    alignItems: "center",
  },
  coverLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  coverLogoText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#14532A",
    fontFamily: "Helvetica-Bold",
  },
  coverTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 32,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 12,
    color: "#A7F3D0",
    textAlign: "center",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  coverBody: {
    flex: 1,
    paddingHorizontal: 48,
    paddingTop: 60,
    paddingBottom: 40,
  },
  coverInfo: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 4,
  },
  coverInfoValue: {
    fontSize: 13,
    color: "#1F2937",
    fontFamily: "Helvetica-Bold",
    marginBottom: 16,
  },
  coverFooter: {
    paddingHorizontal: 48,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 16,
  },
  coverFooterText: {
    fontSize: 9,
    color: "#9CA3AF",
    textAlign: "center",
  },
  // Bandeau de page (header)
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#14532A",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  headerRight: {
    fontSize: 9,
    color: "#D1FAE5",
    textAlign: "right",
  },
  // Titres de section
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    color: "#14532A",
    marginBottom: 8,
    marginTop: 12,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: "#10B981",
  },
  // KPIs
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  kpiCard: {
    width: "33%",
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginBottom: 8,
    borderRadius: 4,
    backgroundColor: "#14532A",
    marginRight: "0.5%",
  },
  kpiLabel: {
    fontSize: 8,
    color: "#D1FAE5",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  // Tableaux
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB",
    borderBottomWidth: 1,
    borderBottomColor: "#9CA3AF",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  tableFooter: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderTopWidth: 1,
    borderTopColor: "#9CA3AF",
    fontFamily: "Helvetica-Bold",
  },
  cell: {
    fontSize: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  cellRight: {
    fontSize: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    textAlign: "right",
  },
  cellBold: {
    fontSize: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    fontFamily: "Helvetica-Bold",
  },
  cellRightBold: {
    fontSize: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  // Résumé capital
  capitalInitial: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  capitalInitialLabel: {
    fontSize: 8,
    color: "#10B981",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  capitalInitialValue: {
    fontSize: 18,
    color: "#14532A",
    fontFamily: "Helvetica-Bold",
  },
  resumeGrid: {
    flexDirection: "row",
    marginBottom: 10,
  },
  resumeCard: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 4,
  },
  resumeLabel: {
    fontSize: 7,
    color: "#6B7280",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  resumeValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  // Mouvements de capital
  mvtRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    borderTopWidth: 0.5,
    borderTopColor: "#9CA3AF",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#9CA3AF",
  },
  // Alertes
  alertRow: {
    flexDirection: "row",
    marginBottom: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  alertSeverite: {
    width: 60,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#DC2626",
  },
  alertMessage: {
    flex: 1,
    fontSize: 8,
    color: "#1F2937",
  },
});

// ============================================================
//  Sections (composants PDF purs)
// ============================================================

function KpiGrid({ kpis }: { kpis: RapportBailleur["kpis"] }) {
  const items = [
    { label: "Animaux actifs (fin)", value: String(kpis.bovinsActifs) },
    { label: "Chiffre d'affaires cumulé", value: formatFCFAShortPdg(kpis.caCumul) },
    { label: "Marge totale cumulée", value: formatFCFAShortPdg(kpis.margeTotale) },
    { label: "Marge moyenne / tête", value: formatFCFAPdf(kpis.margeParTete, false) },
    { label: "Taux util. fin.", value: `${Math.round(kpis.tauxUtilisation)}%` },
    { label: "Trésorerie disponible", value: formatFCFAShortPdg(kpis.tresorerie) },
  ];
  return (
    <View style={styles.kpiGrid}>
      {items.map((k, i) => (
        <View key={i} style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{k.label}</Text>
          <Text style={styles.kpiValue}>{k.value}</Text>
        </View>
      ))}
    </View>
  );
}

function BalanceTablePDF({ balance }: { balance: RapportBailleur["balance"] }) {
  const colWidths = ["10%", "25%", "16%", "16%", "16%", "16%"];
  return (
    <View>
      <View style={styles.tableHeader}>
        <Text style={[styles.cellBold, { width: colWidths[0] }]}>Compte</Text>
        <Text style={[styles.cellBold, { width: colWidths[1] }]}>Libellé</Text>
        <Text style={[styles.cellRight, { width: colWidths[2] }]}>Mvt N Débit</Text>
        <Text style={[styles.cellRight, { width: colWidths[3] }]}>Mvt N Crédit</Text>
        <Text style={[styles.cellRight, { width: colWidths[4] }]}>Solde N Débit</Text>
        <Text style={[styles.cellRight, { width: colWidths[5] }]}>Solde N Crédit</Text>
      </View>
      {balance.lignes.map((c: BalanceLigne, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.cell, { width: colWidths[0] }]}>{c.numCompte}</Text>
          <Text style={[styles.cell, { width: colWidths[1] }]}>{c.libelle}</Text>
          <Text style={[styles.cellRight, { width: colWidths[2] }]}>{c.mvtNDebit > 0 ? formatFCFAPdf(c.mvtNDebit, false) : "—"}</Text>
          <Text style={[styles.cellRight, { width: colWidths[3] }]}>{c.mvtNCredit > 0 ? formatFCFAPdf(c.mvtNCredit, false) : "—"}</Text>
          <Text style={[styles.cellRight, { width: colWidths[4] }]}>{c.soldeNDebit > 0 ? formatFCFAPdf(c.soldeNDebit, false) : "—"}</Text>
          <Text style={[styles.cellRight, { width: colWidths[5] }]}>{c.soldeNCredit > 0 ? formatFCFAPdf(c.soldeNCredit, false) : "—"}</Text>
        </View>
      ))}
      <View style={styles.tableFooter}>
        <Text style={[styles.cellBold, { width: colWidths[0] }]}>TOTAL</Text>
        <Text style={[styles.cellBold, { width: colWidths[1] }]}>Général</Text>
        <Text style={[styles.cellRightBold, { width: colWidths[2] }]}>{formatFCFAPdf(balance.totalDebitGeneral, false)}</Text>
        <Text style={[styles.cellRightBold, { width: colWidths[3] }]}>{formatFCFAPdf(balance.totalCreditGeneral, false)}</Text>
        <Text style={[styles.cellRightBold, { width: colWidths[4] }]}>{formatFCFAPdf(balance.soldeDebitGeneral, false)}</Text>
        <Text style={[styles.cellRightBold, { width: colWidths[5] }]}>{formatFCFAPdf(balance.soldeCreditGeneral, false)}</Text>
      </View>
    </View>
  );
}

function CapitalSuiviPDF({ capital }: { capital: RapportBailleur["capital"] }) {
  return (
    <View>
      <View style={styles.capitalInitial}>
        <Text style={styles.capitalInitialLabel}>Capital initial (figé)</Text>
        <Text style={styles.capitalInitialValue}>{formatFCFAPdf(capital.capitalInitial)}</Text>
      </View>
      <View style={styles.resumeGrid}>
        <View style={[styles.resumeCard, { backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#10B981" }]}>
          <Text style={[styles.resumeLabel, { color: "#10B981" }]}>Ajouts</Text>
          <Text style={[styles.resumeValue, { color: "#10B981" }]}>+ {formatFCFAPdf(capital.totalEntrees, false)}</Text>
        </View>
        <View style={[styles.resumeCard, { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#EF4444" }]}>
          <Text style={[styles.resumeLabel, { color: "#EF4444" }]}>Retraits</Text>
          <Text style={[styles.resumeValue, { color: "#EF4444" }]}>− {formatFCFAPdf(capital.totalSorties, false)}</Text>
        </View>
        <View style={[styles.resumeCard, { backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#14532A" }]}>
          <Text style={[styles.resumeLabel, { color: "#14532A" }]}>Solde actuel</Text>
          <Text style={[styles.resumeValue, { color: "#14532A" }]}>{formatFCFAPdf(capital.soldeRestant, false)}</Text>
        </View>
      </View>
      <View style={styles.tableHeader}>
        <Text style={[styles.cellBold, { width: "20%" }]}>Date</Text>
        <Text style={[styles.cellBold, { width: "15%" }]}>Sens</Text>
        <Text style={[styles.cellBold, { width: "45%" }]}>Libellé</Text>
        <Text style={[styles.cellRight, { width: "20%" }]}>Montant</Text>
      </View>
      {capital.mouvements.slice(0, 30).map((m: CapitalMouvementItem, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.cell, { width: "20%" }]}>{m.date}</Text>
          <Text style={[styles.cell, { width: "15%", color: m.sens === "sortie" ? "#EF4444" : "#10B981" }]}>{m.typeLabel}</Text>
          <Text style={[styles.cell, { width: "45%" }]}>{m.libelle}</Text>
          <Text style={[styles.cellRight, { width: "20%", color: m.sens === "sortie" ? "#EF4444" : "#10B981" }]}>
            {m.sens === "sortie" ? "− " : "+ "}{formatFCFAPdf(m.montant, false)}
          </Text>
        </View>
      ))}
      {capital.mouvements.length === 0 && (
        <Text style={[styles.cell, { textAlign: "center", paddingVertical: 8, color: "#9CA3AF" }]}>Aucun mouvement enregistré</Text>
      )}
    </View>
  );
}

function BudgetTablePDF({ budget }: { budget: RapportBailleur["budget"] }) {
  const colWidths = ["40%", "15%", "15%", "15%", "15%"];
  return (
    <View>
      <View style={styles.tableHeader}>
        <Text style={[styles.cellBold, { width: colWidths[0] }]}>Poste</Text>
        <Text style={[styles.cellRight, { width: colWidths[1] }]}>Prévision</Text>
        <Text style={[styles.cellRight, { width: colWidths[2] }]}>Réel</Text>
        <Text style={[styles.cellRight, { width: colWidths[3] }]}>Écart</Text>
        <Text style={[styles.cellRight, { width: colWidths[4] }]}>%</Text>
      </View>
      {budget.sections.map((section: BudgetSection, idx) => (
        <View key={idx}>
          <View style={{ backgroundColor: "#F3F4F6", paddingHorizontal: 4, paddingVertical: 2 }}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {section.titre}
            </Text>
          </View>
          {section.lignes.map((ligne: BudgetLigne, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cell, { width: colWidths[0], paddingLeft: 12 }]}>{ligne.poste}</Text>
              <Text style={[styles.cellRight, { width: colWidths[1] }]}>{formatFCFAPdf(ligne.previs, false)}</Text>
              <Text style={[styles.cellRight, { width: colWidths[2] }]}>{formatFCFAPdf(ligne.reel, false)}</Text>
              <Text style={[styles.cellRight, { width: colWidths[3], color: ligne.ecart >= 0 ? "#10B981" : "#EF4444" }]}>
                {ligne.ecart >= 0 ? "+" : "−"} {formatFCFAPdf(Math.abs(ligne.ecart), false)}
              </Text>
              <Text style={[styles.cellRight, { width: colWidths[4], color: ligne.pct <= 100 ? "#10B981" : "#EF4444" }]}>
                {Math.round(ligne.pct)}%
              </Text>
            </View>
          ))}
          <View style={[styles.tableRow, { backgroundColor: "#F9FAFB" }]}>
            <Text style={[styles.cellBold, { width: colWidths[0] }]}>{section.sousTotal.poste}</Text>
            <Text style={[styles.cellRightBold, { width: colWidths[1] }]}>{formatFCFAPdf(section.sousTotal.previs, false)}</Text>
            <Text style={[styles.cellRightBold, { width: colWidths[2] }]}>{formatFCFAPdf(section.sousTotal.reel, false)}</Text>
            <Text style={[styles.cellRightBold, { width: colWidths[3], color: section.sousTotal.ecart >= 0 ? "#10B981" : "#EF4444" }]}>
              {section.sousTotal.ecart >= 0 ? "+" : "−"} {formatFCFAPdf(Math.abs(section.sousTotal.ecart), false)}
            </Text>
            <Text style={[styles.cellRightBold, { width: colWidths[4] }]}>{Math.round(section.sousTotal.pct)}%</Text>
          </View>
        </View>
      ))}
      <View style={styles.tableFooter}>
        <Text style={[styles.cellBold, { width: colWidths[0] }]}>{budget.totalGeneral.poste}</Text>
        <Text style={[styles.cellRightBold, { width: colWidths[1] }]}>{formatFCFAPdf(budget.totalGeneral.previs, false)}</Text>
        <Text style={[styles.cellRightBold, { width: colWidths[2] }]}>{formatFCFAPdf(budget.totalGeneral.reel, false)}</Text>
        <Text style={[styles.cellRightBold, { width: colWidths[3], color: budget.totalGeneral.ecart >= 0 ? "#10B981" : "#EF4444" }]}>
          {budget.totalGeneral.ecart >= 0 ? "+" : "−"} {formatFCFAPdf(Math.abs(budget.totalGeneral.ecart), false)}
        </Text>
        <Text style={[styles.cellRightBold, { width: colWidths[4] }]}>{Math.round(budget.totalGeneral.pct)}%</Text>
      </View>
    </View>
  );
}

function InvestissementsTablePDF({ investissements }: { investissements: RapportBailleur["investissements"] }) {
  const colWidths = ["15%", "55%", "15%", "15%"];
  const total = investissements.reduce((s, i) => s + i.montant, 0);
  return (
    <View>
      <View style={styles.tableHeader}>
        <Text style={[styles.cellBold, { width: colWidths[0] }]}>Date</Text>
        <Text style={[styles.cellBold, { width: colWidths[1] }]}>Libellé</Text>
        <Text style={[styles.cellBold, { width: colWidths[2] }]}>Catégorie</Text>
        <Text style={[styles.cellRight, { width: colWidths[3] }]}>Montant</Text>
      </View>
      {investissements.map((inv, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.cell, { width: colWidths[0] }]}>{inv.date}</Text>
          <Text style={[styles.cell, { width: colWidths[1] }]}>{inv.libelle}</Text>
          <Text style={[styles.cell, { width: colWidths[2], color: "#10B981" }]}>{inv.categorie}</Text>
          <Text style={[styles.cellRight, { width: colWidths[3], color: "#EF4444" }]}>{formatFCFAPdf(inv.montant, false)}</Text>
        </View>
      ))}
      {investissements.length === 0 && (
        <Text style={[styles.cell, { textAlign: "center", paddingVertical: 8, color: "#9CA3AF" }]}>Aucune dépense d'investissement</Text>
      )}
      <View style={styles.tableFooter}>
        <Text style={[styles.cellBold, { width: colWidths[0] }]}>TOTAL</Text>
        <Text style={[styles.cellBold, { width: colWidths[1] }]}></Text>
        <Text style={[styles.cellBold, { width: colWidths[2] }]}></Text>
        <Text style={[styles.cellRightBold, { width: colWidths[3], color: "#EF4444" }]}>{formatFCFAPdf(total, false)}</Text>
      </View>
    </View>
  );
}

function AnnexeMensuellePDF({ monthly }: { monthly: RapportBailleur["monthly"] }) {
  const colWidths = ["10%", "10%", "10%", "10%", "12%", "12%", "12%", "12%", "12%"];
  return (
    <View>
      <View style={styles.tableHeader}>
        <Text style={[styles.cellBold, { width: colWidths[0] }]}>Mois</Text>
        <Text style={[styles.cellRight, { width: colWidths[1] }]}>Actifs</Text>
        <Text style={[styles.cellRight, { width: colWidths[2] }]}>Achats</Text>
        <Text style={[styles.cellRight, { width: colWidths[3] }]}>Ventes</Text>
        <Text style={[styles.cellRight, { width: colWidths[4] }]}>CA</Text>
        <Text style={[styles.cellRight, { width: colWidths[5] }]}>Coût alim.</Text>
        <Text style={[styles.cellRight, { width: colWidths[6] }]}>Marge</Text>
        <Text style={[styles.cellRight, { width: colWidths[7] }]}>Marge/tête</Text>
        <Text style={[styles.cellRight, { width: colWidths[8] }]}>Trésorerie</Text>
      </View>
      {monthly.map((row, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.cell, { width: colWidths[0] }]}>{row.mois}</Text>
          <Text style={[styles.cellRight, { width: colWidths[1] }]}>{row.bovinsActifs}</Text>
          <Text style={[styles.cellRight, { width: colWidths[2] }]}>{row.achats}</Text>
          <Text style={[styles.cellRight, { width: colWidths[3] }]}>{row.ventes}</Text>
          <Text style={[styles.cellRight, { width: colWidths[4] }]}>{row.ca > 0 ? formatFCFAShortPdg(row.ca) : "—"}</Text>
          <Text style={[styles.cellRight, { width: colWidths[5] }]}>{row.coutAlimentation > 0 ? formatFCFAShortPdg(row.coutAlimentation) : "—"}</Text>
          <Text style={[styles.cellRight, { width: colWidths[6], color: row.margeTotale >= 0 ? "#10B981" : "#EF4444" }]}>
            {formatFCFAShortPdg(row.margeTotale)}
          </Text>
          <Text style={[styles.cellRight, { width: colWidths[7] }]}>{row.ventes > 0 ? formatFCFAPdf(row.margeParTete, false) : "—"}</Text>
          <Text style={[styles.cellRight, { width: colWidths[8] }]}>{formatFCFAShortPdg(row.tresorerie)}</Text>
        </View>
      ))}
    </View>
  );
}

function AlertesPDF({ alertes }: { alertes: RapportBailleur["alertes"] }) {
  const actives = alertes.filter((a) => !a.resolved);
  return (
    <View>
      <Text style={styles.sectionTitle}>Alertes & faits marquants ({actives.length})</Text>
      {actives.length === 0 ? (
        <Text style={[styles.cell, { paddingVertical: 8, color: "#10B981" }]}>Aucune alerte active.</Text>
      ) : (
        actives.slice(0, 20).map((a, i) => (
          <View key={i} style={styles.alertRow}>
            <Text style={[styles.alertSeverite, { color: a.severite === "CRITICAL" ? "#DC2626" : a.severite === "WARNING" ? "#D97706" : "#0284C7" }]}>
              {a.severite}
            </Text>
            <Text style={styles.alertMessage}>{a.message}</Text>
          </View>
        ))
      )}
    </View>
  );
}

// ============================================================
//  Document PDF — 5 pages
// ============================================================

interface RapportBailleurPdfProps {
  rapport: RapportBailleur;
  year: number;
}

export function RapportBailleurPdf({ rapport, year }: RapportBailleurPdfProps) {
  const today = formatDatePdg(new Date());
  const pageFooter = (
    <View style={styles.footer} fixed>
      <Text>SAVERDEV DURABLE — Rapport Bailleur — Exercice {year}</Text>
      <Text>Confidentiel · Document généré le {today}</Text>
    </View>
  );

  return (
    <Document
      title={`Rapport Bailleur SAVERDEV — Exercice ${year}`}
      author="SAVERDEV DURABLE — Sahel Vert pour un Développement Durable"
      subject="Tableau de bord destiné au bailleur de fonds"
      creator="SAVERDEV — Application de gestion d'élevage bovin"
    >
      {/* ============ PAGE 1 : Couverture ============ */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverTop}>
          <View style={styles.coverLogo}>
            <Text style={styles.coverLogoText}>SV</Text>
          </View>
          <Text style={styles.coverTitle}>SAVERDEV DURABLE</Text>
          <Text style={styles.coverSubtitle}>Sahel Vert · Développement</Text>
        </View>
        <View style={styles.coverBody}>
          <Text style={{ fontSize: 24, fontFamily: "Helvetica-Bold", color: "#14532A", marginBottom: 8 }}>
            Rapport Bailleur
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 32 }}>
            Tableau de bord — modèle E2A
          </Text>
          <Text style={styles.coverInfo}>Exercice</Text>
          <Text style={styles.coverInfoValue}>{year}</Text>
          <Text style={styles.coverInfo}>Date de génération</Text>
          <Text style={styles.coverInfoValue}>{today}</Text>
          <Text style={styles.coverInfo}>Destinataire</Text>
          <Text style={styles.coverInfoValue}>Bailleur de fonds</Text>
          <Text style={styles.coverInfo}>Montants</Text>
          <Text style={styles.coverInfoValue}>FCFA (Francs CFA)</Text>
        </View>
        <View style={styles.coverFooter}>
          <Text style={styles.coverFooterText}>
            SAVERDEV DURABLE — Sahel Vert pour un Développement Durable · Document confidentiel · Tous droits réservés
          </Text>
        </View>
      </Page>

      {/* ============ PAGE 2 : KPI + Résumé ============ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tableau de bord — Exercice {year}</Text>
          <Text style={styles.headerRight}>SAVERDEV DURABLE · Page 2/5</Text>
        </View>
        <Text style={styles.sectionTitle}>Synthèse annuelle — Indicateurs clés (KPI)</Text>
        <KpiGrid kpis={rapport.kpis} />
        <Text style={styles.sectionTitle}>Structure des coûts (cumul annuel)</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.cellBold, { width: "60%" }]}>Poste de coût</Text>
          <Text style={[styles.cellRight, { width: "40%" }]}>Montant cumulé</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.cell, { width: "60%" }]}>Achat des bovins</Text>
          <Text style={[styles.cellRight, { width: "40%", color: "#F59E0B" }]}>{formatFCFAPdf(rapport.costStructure.achatBovins)}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.cell, { width: "60%" }]}>Alimentation</Text>
          <Text style={[styles.cellRight, { width: "40%", color: "#10B981" }]}>{formatFCFAPdf(rapport.costStructure.alimentation)}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.cell, { width: "60%" }]}>Engraissement (autres coûts)</Text>
          <Text style={[styles.cellRight, { width: "40%", color: "#3B82F6" }]}>{formatFCFAPdf(rapport.costStructure.engraissement)}</Text>
        </View>
        {pageFooter}
      </Page>

      {/* ============ PAGE 3 : Section A — Balance comptable ============ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Section A — Balance comptable</Text>
          <Text style={styles.headerRight}>SAVERDEV DURABLE · Page 3/5</Text>
        </View>
        <Text style={styles.sectionTitle}>Balance comptable — exercice {year}</Text>
        <BalanceTablePDF balance={rapport.balance} />
        {pageFooter}
      </Page>

      {/* ============ PAGE 4 : Section B + C — Capital + Budget ============ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sections B & C — Financement & Budget</Text>
          <Text style={styles.headerRight}>SAVERDEV DURABLE · Page 4/5</Text>
        </View>
        <Text style={styles.sectionTitle}>Section B — Suivi du financement</Text>
        <CapitalSuiviPDF capital={rapport.capital} />
        <Text style={styles.sectionTitle}>Section C — Suivi budgétaire</Text>
        <BudgetTablePDF budget={rapport.budget} />
        {pageFooter}
      </Page>

      {/* ============ PAGE 5 : Section D + Annexe mensuelle ============ */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Section D & Annexe — Investissements & Mensuel</Text>
          <Text style={styles.headerRight}>SAVERDEV DURABLE · Page 5/5</Text>
        </View>
        <Text style={styles.sectionTitle}>Section D — Dépenses d'investissement en immobilisations</Text>
        <InvestissementsTablePDF investissements={rapport.investissements} />
        <Text style={styles.sectionTitle}>Annexe — Récapitulatif mensuel</Text>
        <AnnexeMensuellePDF monthly={rapport.monthly} />
        <AlertesPDF alertes={rapport.alertes} />
        {pageFooter}
      </Page>
    </Document>
  );
}

// Note : Font est requis par @react-pdf/renderer pour register, mais on
// n'enregistre aucune police personnalisée (on utilise Helvetica/Times
// natives). L'import est conservé pour éviter l'avertissement "Font
// registered but never used".
void Font;

// ============================================================
//  Helper de génération du PDF stream (utilisé par /api/rapport-bailleur/export-pdf)
//  On factorise ici l'appel à renderToStream pour que la route API
//  puisse rester un fichier .ts simple (pas de JSX dans la route).
// ============================================================

/** Génère le PDF du rapport bailleur et retourne un stream lisible. */
export async function renderRapportBailleurPdf(
  rapport: RapportBailleur,
  year: number
): Promise<NodeJS.ReadableStream> {
  // On construit l'élément JSX ici (dans un fichier .tsx) plutôt que dans
  // la route API (qui resterait en .ts). Permet aussi de garder la logique
  // de rendu PDF réutilisable par d'autres routes futures.
  const pdfElement = <RapportBailleurPdf rapport={rapport} year={year} />;
  const stream = await renderToStream(pdfElement);
  return stream as unknown as NodeJS.ReadableStream;
}
