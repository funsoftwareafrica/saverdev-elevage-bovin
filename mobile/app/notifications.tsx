// Écran Notifications — liste des notifications + alertes (cron côté serveur).
import * as React from "react";
import { useEffect, useRef } from "react";
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useNotifications, useMarkAllNotifsRead } from "@/lib/api";
import { theme } from "@/constants/theme";
import { SaverdevLogo } from "@/components/SaverdevLogo";
import { Button } from "@/components/Button";
import { formatDate } from "@/lib/format";
import { ArrowLeft, Bell, Check, AlertTriangle, AlertCircle, Info } from "lucide-react-native";

function iconFor(type: string, titre: string) {
  const lc = `${type} ${titre}`.toLowerCase();
  if (lc.includes("critique") || lc.includes("mortalité")) return { Icon: AlertCircle, color: theme.colors.destructive };
  if (lc.includes("attente") || lc.includes("bas") || lc.includes("demain") || lc.includes("élevé")) return { Icon: AlertTriangle, color: "#D97706" };
  return { Icon: Info, color: "#0284C7" };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch } = useNotifications();
  const markAll = useMarkAllNotifsRead();
  const fetchRef = useRef(false);

  // Refresh au montage
  useEffect(() => {
    if (fetchRef.current) return;
    fetchRef.current = true;
    refetch();
  }, [refetch]);

  const items = data?.items ?? [];
  const nonLues = data?.nonLues ?? 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingTop: 16 + insets.top, paddingBottom: 40, gap: 16 }}
    >
      <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
        <ArrowLeft size={16} color={theme.colors.muted} />
        <Text style={styles.backLabel}>Retour</Text>
      </Pressable>

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            {nonLues > 0 ? `${nonLues} non lue(s)` : "Toutes les notifications sont lues"}
          </Text>
        </View>
        <SaverdevLogo size={40} />
      </View>

      {nonLues > 0 && (
        <Button
          label={markAll.isPending ? "Marquage…" : "Tout marquer comme lu"}
          variant="outline"
          size="sm"
          icon={markAll.isPending ? <ActivityIndicator color={theme.colors.primary} size="small" /> : <Check size={16} color={theme.colors.primary} />}
          onPress={() => markAll.mutate()}
        />
      )}

      {isLoading ? (
        <View style={styles.emptyBox}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.emptyText}>Chargement…</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Bell size={48} color={theme.colors.muted} />
          <Text style={styles.emptyText}>Aucune notification.</Text>
          <Text style={styles.emptySubtext}>
            Les alertes (échéances, stock, budget, mortalité) apparaîtront ici.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map((n) => {
            const { Icon, color } = iconFor(n.type, n.titre);
            return (
              <View key={`${n.source ?? "n"}-${n.id}`} style={[styles.card, !n.lu && styles.cardUnread]}>
                <View style={styles.cardHead}>
                  <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
                    <Icon size={18} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{n.titre}</Text>
                    <Text style={styles.cardDate}>{formatDate(n.date)}</Text>
                  </View>
                  {!n.lu && <View style={styles.dot} />}
                </View>
                <Text style={styles.cardMessage}>{n.message}</Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingVertical: 4, paddingRight: 8 },
  backLabel: { fontSize: 13, color: theme.colors.muted, fontWeight: "500" },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { fontSize: 22, fontWeight: "700" as const, color: theme.colors.foreground, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },

  emptyBox: { alignItems: "center", gap: 10, paddingVertical: 60, paddingHorizontal: 24 },
  emptyText: { fontSize: 14, fontWeight: "700" as const, color: theme.colors.foreground },
  emptySubtext: { fontSize: 12, color: theme.colors.muted, textAlign: "center", marginTop: 4 },

  list: { gap: 8 },
  card: { backgroundColor: theme.colors.card, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: 12, gap: 8, ...theme.shadows.card },
  cardUnread: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryFaint },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  cardTitle: { fontSize: 14, fontWeight: "700" as const, color: theme.colors.foreground },
  cardDate: { fontSize: 11, color: theme.colors.muted, marginTop: 2 },
  cardMessage: { fontSize: 12, color: theme.colors.foreground, lineHeight: 17 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary },
});
