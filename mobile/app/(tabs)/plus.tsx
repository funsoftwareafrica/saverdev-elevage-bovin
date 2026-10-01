// Vue Plus — menu des vues secondaires + accès profil
import * as React from "react";
import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { SaverdevLogo } from "@/components/SaverdevLogo";
import { Wheat, Receipt, Banknote, ChevronRight, User, QrCode } from "lucide-react-native";

const ITEMS = [
  { label: "Alimentation", desc: "Achats d'aliments + imputation", icon: Wheat, route: "/(tabs)/alimentation" },
  { label: "Dépenses", desc: "Soins, transport, main-d'œuvre", icon: Receipt, route: "/(tabs)/depenses" },
  { label: "Ventes", desc: "Enregistrement + marge auto", icon: Banknote, route: "/(tabs)/ventes" },
];

export default function PlusScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16, paddingTop: 16 + insets.top, paddingBottom: 40, gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <SaverdevLogo size={48} />
        <View>
          <Text style={{ fontSize: 22, fontWeight: "700" as const, color: theme.colors.foreground }}>Plus</Text>
        </View>
      </View>

      {ITEMS.map((item) => (
        <Pressable key={item.label} onPress={() => router.push(item.route as any)} style={({ pressed }) => [styles.row, pressed && { transform: [{ scale: 0.98 }] }]}>
          <View style={styles.rowIcon}><item.icon size={20} color={theme.colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowDesc}>{item.desc}</Text>
          </View>
          <ChevronRight size={18} color={theme.colors.muted} />
        </Pressable>
      ))}

      <Pressable onPress={() => router.push("/profile" as any)} style={({ pressed }) => [styles.row, pressed && { transform: [{ scale: 0.98 }] }]}>
        <View style={styles.rowIcon}><User size={20} color={theme.colors.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>Profil & rôle</Text>
          <Text style={styles.rowDesc}>Changer de rôle, à propos</Text>
        </View>
        <ChevronRight size={18} color={theme.colors.muted} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, backgroundColor: theme.colors.card, borderRadius: 14, ...theme.shadows.card },
  rowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primaryFaint, justifyContent: "center", alignItems: "center" },
  rowLabel: { fontSize: 15, fontWeight: "600" as const, color: theme.colors.foreground },
  rowDesc: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
});
