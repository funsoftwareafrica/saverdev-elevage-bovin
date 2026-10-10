// Rentabilité — marges, ventilation des coûts, tendances par bovin vendu.
// Pattern : useDashboard() + useBovins() → skeleton → KpiCards + Donut + Bar + table détaillée.
import * as React from "react";
import { ScrollView, View, Text, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDashboard, useBovins } from "@/lib/api";
import { formatFCFA, formatFCFAShort, formatDate } from "@/lib/format";
import { computeBovinMarge } from "@/lib/calculations";
import { theme } from "@/constants/theme";
import { KpiCard } from "@/components/KpiCard";
import { Card } from "@/components/Card";
import { SectionTitle } from "@/components/Section";
import { Skeleton } from "@/components/Skeleton";
import { SaverdevLogo } from "@/components/SaverdevLogo";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarChart } from "@/components/charts/BarChart";
import {
  BarChart3, TrendingUp, ShoppingCart, Database, Package,
} from "lucide-react-native";

export default function RentabiliteScreen() {
  const { data: dash, isLoading, refetch, isRefetching } = useDashboard();
  const { data: bovins } = useBovins();
  const insets = useSafeAreaInsets();

  if (isLoading || !dash) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{ padding: 16, paddingTop: 16 + insets.top, gap: 16 }}
      >
        <Skeleton style={{ height: 60 }} />
        <View style={{ flexDirection: "row", gap: 8 }}>{[1, 2, 3, 4].map((i) => <Skeleton key={i} style={{ flex: 1, height: 100, borderRadius: 12 }} />)}</View>
        <Skeleton style={{ height: 220, borderRadius: 16 }} />
        <Skeleton style={{ height: 280, borderRadius: 16 }} />
      </ScrollView>
    );
  }

  const r = dash.rentabilite;
  const vendus = (bovins ?? []).filter((b) => b.statut === "VENDU");
  const ca = r.ca;
  const marge = r.margeTotale;
  const tauxMarge = ca > 0 ? Math.round((marge / ca) * 100) : 0;
  const prixVenteMoyen = vendus.length ? ca / vendus.length : 0;
  const coutRevientTotal = r.coutAchat + r.coutEngraissement;
  const coutRevientMoyen = vendus.length ? coutRevientTotal / vendus.length : 0;

  const coutAlimVendus = vendus.reduce((s, b) => s + b.coutsEngraissement, 0);
  const coutAutresVendus = vendus.reduce((s, b) => s + b.autresCouts, 0);
  const totalCouts = r.coutAchat + coutAlimVendus + coutAutresVendus;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingTop: 16 + insets.top, paddingBottom: 100, gap: 16 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
    >
      {/* En-tête */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Rentabilité</Text>
          <Text style={styles.subtitle}>Marges, ventilation des coûts, tendances</Text>
        </View>
        <SaverdevLogo size={40} />
      </View>

      {/* KPI row */}
      <View style={styles.grid4}>
        <KpiCard label="CA" value={formatFCFAShort(ca)} icon={ShoppingCart} variant="success" />
        <KpiCard label="Coût achat" value={formatFCFAShort(r.coutAchat)} icon={Database} />
        <KpiCard label="Engrais." value={formatFCFAShort(r.coutEngraissement)} icon={Package} />
        <KpiCard
          label="Marge totale"
          value={formatFCFAShort(marge)}
          icon={TrendingUp}
          variant={marge >= 0 ? "success" : "danger"}
        />
      </View>

      {/* Synthèse marge/tête */}
      <View>
        <SectionTitle icon={TrendingUp} title="Synthèse marge/tête" subtitle="Indicateurs par animal vendu" />
        <Card>
          <View style={styles.statGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Marge moyenne</Text>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>{formatFCFA(r.margeParTete)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Taux de marge</Text>
              <Text style={[styles.statValue, { color: theme.colors.violet }]}>{tauxMarge}%</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Prix vente moyen</Text>
              <Text style={styles.statValue}>{formatFCFA(prixVenteMoyen)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Coût revient moyen</Text>
              <Text style={styles.statValue}>{formatFCFA(coutRevientMoyen)}</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Ventilation des coûts */}
      <View>
        <SectionTitle icon={BarChart3} title="Ventilation des coûts" subtitle="Répartition par poste" />
        <Card>
          <View style={{ alignItems: "center", marginTop: 4 }}>
            <DonutChart
              size={180}
              data={[
                { value: r.coutAchat, color: theme.colors.destructive, label: "Achat bovins" },
                { value: coutAlimVendus, color: theme.colors.violet, label: "Alimentation" },
                { value: coutAutresVendus, color: theme.colors.cyan, label: "Autres" },
              ]}
            />
          </View>
          <View style={styles.legendCol}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.destructive }]} />
              <Text style={styles.legendLabel}>Achat bovins</Text>
              <Text style={styles.legendVal}>{formatFCFA(r.coutAchat)}</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.violet }]} />
              <Text style={styles.legendLabel}>Alimentation</Text>
              <Text style={styles.legendVal}>{formatFCFA(coutAlimVendus)}</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.cyan }]} />
              <Text style={styles.legendLabel}>Autres</Text>
              <Text style={styles.legendVal}>{formatFCFA(coutAutresVendus)}</Text>
            </View>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total coûts</Text>
            <Text style={styles.totalValue}>{formatFCFA(totalCouts)}</Text>
          </View>
        </Card>
      </View>

      {/* Marges par bovin vendu */}
      <View>
        <SectionTitle icon={BarChart3} title="Marges par bovin vendu" subtitle="Barres vertes = positif, rouges = négatif" />
        <Card>
          <View style={{ alignItems: "center", marginTop: 4 }}>
            <BarChart
              data={vendus.map((b) => {
                const m = computeBovinMarge(b).marge ?? 0;
                return {
                  label: b.identifiant.replace("BOV-", ""),
                  value: m,
                  color: m >= 0 ? theme.colors.primary : theme.colors.destructive,
                };
              })}
              width={340}
              height={180}
              formatValue={(v) => formatFCFAShort(v).replace(" FCFA", "")}
            />
          </View>
        </Card>
      </View>

      {/* Détail des ventes */}
      <View>
        <SectionTitle icon={ShoppingCart} title="Détail des ventes" subtitle={`${vendus.length} bovin(s) vendu(s)`} />
        <Card style={{ padding: 12 }}>
          {/* En-tête colonnes */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.colBovin, styles.tableHeaderText]}>Bovin</Text>
            <Text style={[styles.colDate, styles.tableHeaderText]}>Date</Text>
            <Text style={[styles.colNum, styles.tableHeaderText]}>PV</Text>
            <Text style={[styles.colNum, styles.tableHeaderText]}>CR</Text>
            <Text style={[styles.colNum, styles.tableHeaderText]}>Marge</Text>
            <Text style={[styles.colNum, styles.tableHeaderText]}>%</Text>
          </View>
          {vendus.map((b) => {
            const { coutRevient, marge: mB } = computeBovinMarge(b);
            const m = mB ?? 0;
            const pct = coutRevient > 0 ? Math.round((m / coutRevient) * 100) : 0;
            return (
              <View key={b.id} style={[styles.tableRow, styles.tableDataRow]}>
                <Text style={[styles.colBovin, styles.cellBovinId]}>{b.identifiant.replace("BOV-", "")}</Text>
                <Text style={[styles.colDate, styles.cellText]}>{formatDate(b.dateVente)}</Text>
                <Text style={[styles.colNum, styles.cellText]}>{formatFCFAShort(b.prixVente)}</Text>
                <Text style={[styles.colNum, styles.cellText]}>{formatFCFAShort(coutRevient)}</Text>
                <Text style={[styles.colNum, styles.cellText, { color: m >= 0 ? theme.colors.primary : theme.colors.danger, fontWeight: "600" }]}>{formatFCFAShort(m)}</Text>
                <Text style={[styles.colNum, styles.cellText, { color: m >= 0 ? theme.colors.primary : theme.colors.danger }]}>{pct}%</Text>
              </View>
            );
          })}
          {vendus.length === 0 && (
            <Text style={styles.empty}>Aucune vente enregistrée.</Text>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: theme.colors.foreground },
  subtitle: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  grid4: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statBox: { flexBasis: "47%", flexGrow: 1, backgroundColor: theme.colors.hairline, borderRadius: theme.radius.md, padding: 12, gap: 4 },
  statLabel: { fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: "500", color: theme.colors.muted },
  statValue: { fontSize: 16, fontWeight: "700", color: theme.colors.foreground, marginTop: 2 },
  legendCol: { marginTop: 16, gap: 8 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: 12, color: theme.colors.foreground },
  legendVal: { fontSize: 12, fontWeight: "600", color: theme.colors.foreground },
  totalRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 12, fontWeight: "600", color: theme.colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  totalValue: { fontSize: 16, fontWeight: "700", color: theme.colors.foreground },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.hairline, gap: 4 },
  tableHeader: { borderBottomWidth: 1.5, borderBottomColor: theme.colors.border, paddingBottom: 6, marginBottom: 4 },
  tableHeaderText: { fontSize: 10, fontWeight: "600", color: theme.colors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  tableDataRow: { borderBottomWidth: 1, borderBottomColor: theme.colors.hairline },
  colBovin: { flex: 1.1 },
  colDate: { flex: 1.1 },
  colNum: { flex: 1.3, textAlign: "right" },
  cellText: { fontSize: 11, color: theme.colors.foreground },
  cellBovinId: { fontSize: 11, fontWeight: "600", color: theme.colors.foreground },
  empty: { fontSize: 12, color: theme.colors.subtle, textAlign: "center", paddingVertical: 12 },
});
