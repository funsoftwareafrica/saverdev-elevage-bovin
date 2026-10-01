// Profil — sélecteur de rôle + infos
import * as React from "react";
import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "@/lib/store";
import { ROLE_LABELS } from "@/lib/types";
import { SaverdevLogo } from "@/components/SaverdevLogo";
import { theme } from "@/constants/theme";
import { Check } from "lucide-react-native";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["ELEVEUR", "GERANT", "BAILLEUR", "ADMIN"];
const ROLE_DESC: Record<Role, string> = {
  ELEVEUR: "Saisie et consultation quotidienne",
  GERANT: "Pilotage, reporting et administration",
  BAILLEUR: "Consultation lecture seule",
  ADMIN: "Administration technique",
};

export default function ProfileScreen() {
  const role = useAppStore((s) => s.role);
  const setRole = useAppStore((s) => s.setRole);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16, paddingTop: 16 + insets.top, paddingBottom: 40, gap: 20 }}>
      <View style={{ alignItems: "center", gap: 8 }}>
        <SaverdevLogo size={64} />
        <Text style={{ fontSize: 22, fontWeight: "700" as const, color: theme.colors.foreground, marginTop: 8 }}>SAVERDEV Élevage</Text>
        <Text style={{ fontSize: 12, color: theme.colors.primary }}>Sahel Vert · Développement</Text>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: "600" as const, color: theme.colors.foreground }}>Changer de rôle</Text>
        {ROLES.map((r) => {
          const active = role === r;
          return (
            <Pressable key={r} onPress={() => setRole(r)} style={({ pressed }) => [styles.roleCard, active && styles.roleCardActive, pressed && { transform: [{ scale: 0.98 }] }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.roleLabel, active && { color: theme.colors.primary }]}>{ROLE_LABELS[r]}</Text>
                <Text style={styles.roleDesc}>{ROLE_DESC[r]}</Text>
              </View>
              {active && <Check size={20} color={theme.colors.primary} />}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.aboutCard}>
        <Text style={{ fontSize: 13, color: theme.colors.muted, lineHeight: 20 }}>
          Application mobile de gestion et reporting d'élevage bovin d'engraissement. Version 1.0.0. Données sensibles — accès réservé.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  roleCard: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: theme.colors.card, borderRadius: 14, borderWidth: 1.5, borderColor: theme.colors.border, gap: 8, ...theme.shadows.card },
  roleCardActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryFaint },
  roleLabel: { fontSize: 16, fontWeight: "600" as const, color: theme.colors.foreground },
  roleDesc: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  aboutCard: { backgroundColor: theme.colors.card, borderRadius: 14, padding: 16, ...theme.shadows.card },
});
