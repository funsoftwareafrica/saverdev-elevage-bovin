// Dashboard mobile — SIMPLIFIÉ, gros chiffres, facile à lire
// 4 KPI principaux (pas 12) + gauge + alertes + accès rapide
import * as React from "react";
import { ScrollView, View, Text, StyleSheet, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDashboard, useBovins } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { formatFCFA, formatFCFAShort, formatDate } from "@/lib/format";
import { theme } from "@/constants/theme";
import { SaverdevLogo } from "@/components/SaverdevLogo";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { ROLE_LABELS } from "@/lib/types";
import { Beef, TrendingUp, AlertTriangle, Wallet, ArrowRight, Bell, Plus } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function DashboardScreen() {
  const { data: dash, isLoading, refetch, isRefetching } = useDashboard();
  const { data: bovins } = useBovins();
  const role = useAppStore((s) => s.role);
  const setRole = useAppStore((s) => s.setRole);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  if (isLoading || !dash) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16, paddingTop: 16 + insets.top, gap: 16 }}>
        <Text style={{ color: theme.colors.muted, textAlign: "center", paddingTop: 40 }}>Chargement...</Text>
      </ScrollView>
    );
  }

  const taux = Math.round(dash.financement.tauxUtilisation);
  const alertesCritiques = dash.alertes.filter((a) => !a.resolved && a.severite === "CRITICAL");
  const nbBovins = (bovins ?? []).length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingTop: 16 + insets.top, paddingBottom: 100, gap: 16 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
    >
      {/* Header simple */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.roleLine}>{ROLE_LABELS[role]}</Text>
        </View>
        <SaverdevLogo size={44} />
      </View>

      {/* Alerte critique (si présente) */}
      {alertesCritiques.length > 0 && (
        <View style={styles.alertBox}>
          <AlertTriangle size={20} color={theme.colors.destructive} />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>{alertesCritiques.length} alerte(s) critique(s)</Text>
            <Text style={styles.alertMsg} numberOfLines={2}>{alertesCritiques[0].message}</Text>
          </View>
        </View>
      )}

      {/* 4 KPI principaux — gros chiffres, facile à lire */}
      <View style={styles.kpiGrid}>
        <KpiBox label="Bovins actifs" value={String(dash.cheptel.bovinsActifs)} icon={Beef} color="#10B981" onPress={() => router.push("/(tabs)/bovins" as any)} />
        <KpiBox label="Bovins vendus" value={String(dash.cheptel.bovinsVendus)} icon={TrendingUp} color="#34D399" />
        <KpiBox label="CA total" value={formatFCFAShort(dash.rentabilite.ca)} icon={Wallet} color="#14B8A6" />
        <KpiBox label="Marge" value={formatFCFAShort(dash.rentabilite.margeTotale)} icon={TrendingUp} color={dash.rentabilite.margeTotale >= 0 ? "#10B981" : "#EF4444"} />
      </View>

      {/* Jauge financement */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Financement SAVERDEV</Text>
        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <GaugeChart value={taux} size={220} thickness={18} label="Taux d'utilisation" />
        </View>
        <View style={styles.finStats}>
          <FinStat label="Payées" value={String(dash.financement.echeancesPayees)} color="#10B981" />
          <FinStat label="À payer" value={String(dash.financement.echeancesAPayer)} color="#F59E0B" />
          <FinStat label="En retard" value={String(dash.financement.echeancesEnRetard)} color="#EF4444" />
        </View>
      </View>

      {/* Valeur cheptel + poids moyen (2 stats simples) */}
      <View style={styles.card}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Valeur du cheptel</Text>
          <Text style={styles.statVal}>{formatFCFA(dash.cheptel.valeurCheptel)}</Text>
        </View>
        <View style={[styles.statRow, { borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: 8, paddingTop: 8 }]}>
          <Text style={styles.statLabel}>Poids moyen d'achat</Text>
          <Text style={styles.statVal}>{dash.engraissement.poidsMoyen} kg</Text>
        </View>
        <View style={[styles.statRow, { borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: 8, paddingTop: 8 }]}>
          <Text style={styles.statLabel}>Durée moyenne engrais.</Text>
          <Text style={styles.statVal}>{dash.engraissement.dureeMoyenneJours} jours</Text>
        </View>
      </View>

      {/* Boutons d'accès rapide (grosses touches) */}
      <View style={styles.quickActions}>
        <QuickBtn label="Voir les bovins" icon={Beef} onPress={() => router.push("/(tabs)/bovins" as any)} />
        <QuickBtn label="Rapport bailleur" icon={FileText} onPress={() => router.push("/(tabs)/rapport" as any)} />
      </View>
    </ScrollView>
  );
}

function KpiBox({ label, value, icon: Icon, color, onPress }: { label: string; value: string; icon: typeof Beef; color: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.kpiBox, pressed && { transform: [{ scale: 0.96 }] }]}>
      <View style={[styles.kpiIcon, { backgroundColor: color + "20" }]}>
        <Icon size={22} color={color} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function FinStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" as const, color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: theme.colors.muted, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function QuickBtn({ label, icon: Icon, onPress }: { label: string; icon: typeof Beef; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickBtn, pressed && { transform: [{ scale: 0.97 }] }]}>
      <Icon size={22} color={theme.colors.primary} />
      <Text style={styles.quickBtnLabel}>{label}</Text>
      <ArrowRight size={18} color={theme.colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greeting: { fontSize: 24, fontWeight: "700" as const, color: theme.colors.foreground },
  roleLine: { fontSize: 13, color: theme.colors.muted, marginTop: 2 },
  alertBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 12, padding: 12 },
  alertTitle: { fontSize: 14, fontWeight: "700", color: theme.colors.destructive },
  alertMsg: { fontSize: 12, color: theme.colors.destructive, marginTop: 2 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiBox: { width: "48%", backgroundColor: theme.colors.card, borderRadius: 14, padding: 16, alignItems: "center", ...theme.shadows.card },
  kpiIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  kpiValue: { fontSize: 28, fontWeight: "700" as const, color: theme.colors.foreground },
  kpiLabel: { fontSize: 12, color: theme.colors.muted, marginTop: 4 },
  card: { backgroundColor: theme.colors.card, borderRadius: 14, padding: 16, ...theme.shadows.card },
  cardTitle: { fontSize: 14, fontWeight: "600" as const, color: theme.colors.foreground, marginBottom: 8 },
  finStats: { flexDirection: "row", justifyContent: "space-around", marginTop: 12 },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statLabel: { fontSize: 14, color: theme.colors.muted },
  statVal: { fontSize: 16, fontWeight: "600" as const, color: theme.colors.foreground },
  quickActions: { gap: 10 },
  quickBtn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: theme.colors.card, borderRadius: 14, padding: 16, ...theme.shadows.card },
  quickBtnLabel: { flex: 1, fontSize: 15, fontWeight: "500" as const, color: theme.colors.foreground },
});

// Import needed for QuickBtn icon type
import { FileText } from "lucide-react-native";
