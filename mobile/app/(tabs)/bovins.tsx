// Bovins list — simple, gros touch targets, swipeable feel
import * as React from "react";
import { ScrollView, View, Text, StyleSheet, Pressable, RefreshControl, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBovins } from "@/lib/api";
import { formatFCFA, formatDate, statutBovinColor } from "@/lib/format";
import { computeBovinMarge } from "@/lib/calculs";
import { theme } from "@/constants/theme";
import { Beef, Search, TrendingUp, TrendingDown } from "lucide-react-native";
import { useRouter } from "expo-router";
import type { Bovin, StatutBovin } from "@/lib/types";

export default function BovinsScreen() {
  const { data: bovins, isLoading, refetch, isRefetching } = useBovins();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"TOUS" | StatutBovin>("TOUS");

  const all = bovins ?? [];
  const filtered = all.filter((b) => {
    if (filter !== "TOUS" && b.statut !== filter) return false;
    if (search && !b.identifiant.toLowerCase().includes(search.toLowerCase()) && !b.race.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingTop: 16 + insets.top, paddingBottom: 100, gap: 12 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
    >
      <Text style={styles.title}>Cheptel — Bovins</Text>

      {/* Search — gros input */}
      <View style={styles.searchBox}>
        <Search size={20} color={theme.colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher BOV-001, Zébu..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filtres — gros boutons */}
      <View style={styles.filterRow}>
        {(["TOUS", "EN_ENGRAISSEMENT", "VENDU"] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "TOUS" ? `Tous (${all.length})` : f === "EN_ENGRAISSEMENT" ? `Actifs (${all.filter(b => b.statut === "EN_ENGRAISSEMENT").length})` : `Vendus (${all.filter(b => b.statut === "VENDU").length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Cards — 1 par ligne, gros touch target */}
      {isLoading ? (
        <Text style={{ color: theme.colors.muted, textAlign: "center", paddingTop: 40 }}>Chargement...</Text>
      ) : filtered.length === 0 ? (
        <Text style={{ color: theme.colors.muted, textAlign: "center", paddingTop: 40 }}>Aucun bovin trouvé.</Text>
      ) : (
        filtered.map((b) => {
          const { marge } = computeBovinMarge(b);
          const sc = statutBovinColor(b.statut);
          return (
            <Pressable
              key={b.id}
              onPress={() => router.push({ pathname: "/bovin/[id]", params: { id: b.id } } as any)}
              style={({ pressed }) => [styles.bovinCard, pressed && { transform: [{ scale: 0.98 }] }]}
            >
              <View style={styles.bovinHeader}>
                <Text style={styles.bovinId}>{b.identifiant}</Text>
                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: sc.fg }]} />
                  <Text style={[styles.statusText, { color: sc.fg }]}>
                    {b.statut === "EN_ENGRAISSEMENT" ? "Actif" : b.statut === "VENDU" ? "Vendu" : "Mort"}
                  </Text>
                </View>
              </View>
              <View style={styles.bovinBody}>
                <View>
                  <Text style={styles.bovinRace}>{b.race}</Text>
                  <Text style={styles.bovinMeta}>Achat: {formatDate(b.dateAchat)} · {b.prixAchat.toLocaleString("fr-FR")} FCFA</Text>
                </View>
                {marge !== null && (
                  <View style={styles.margeBox}>
                    {marge >= 0 ? <TrendingUp size={16} color="#10B981" /> : <TrendingDown size={16} color="#EF4444" />}
                    <Text style={[styles.margeText, { color: marge >= 0 ? "#10B981" : "#EF4444" }]}>
                      {formatFCFA(marge, false)}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "700" as const, color: theme.colors.foreground },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: theme.colors.card, borderRadius: 12, paddingHorizontal: 12, height: 48, ...theme.shadows.card },
  searchInput: { flex: 1, fontSize: 15, color: theme.colors.foreground },
  filterRow: { flexDirection: "row", gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: theme.colors.card, alignItems: "center", ...theme.shadows.card },
  filterBtnActive: { backgroundColor: theme.colors.primary },
  filterText: { fontSize: 12, fontWeight: "500" as const, color: theme.colors.muted },
  filterTextActive: { color: "#FFFFFF" },
  bovinCard: { backgroundColor: theme.colors.card, borderRadius: 14, padding: 16, ...theme.shadows.card },
  bovinHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  bovinId: { fontSize: 18, fontWeight: "700" as const, color: theme.colors.primary, fontFamily: "monospace" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600" as const },
  bovinBody: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bovinRace: { fontSize: 15, fontWeight: "500" as const, color: theme.colors.foreground },
  bovinMeta: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  margeBox: { flexDirection: "row", alignItems: "center", gap: 4 },
  margeText: { fontSize: 14, fontWeight: "600" as const },
});
