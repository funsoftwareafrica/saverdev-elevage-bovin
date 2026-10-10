// KpiCard — cellule métrique pastel cattly (bleu/rose/menthe/orange/lavande)
import * as React from "react";
import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import { theme, type CellColor } from "@/constants/theme";
import type { LucideIcon } from "lucide-react-native";

export type KpiVariant = "default" | "primary" | "success" | "warning" | "danger";

const VARIANT_CELL: Record<KpiVariant, CellColor> = {
  default: "neutral",
  primary: "blue",
  success: "mint",
  warning: "orange",
  danger: "pink",
};

const VARIANT_ICON: Record<KpiVariant, { bg: string; fg: string }> = {
  default: { bg: "#F1F5F9", fg: "#64748B" },
  primary: { bg: "#DBEAFE", fg: "#2563EB" },
  success: { bg: "#D1FAE5", fg: "#059669" },
  warning: { bg: "#FFEDD5", fg: "#EA580C" },
  danger: { bg: "#FECACA", fg: "#DC2626" },
};

interface Props {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  variant?: KpiVariant;
  style?: ViewStyle;
}

export function KpiCard({ label, value, icon: Icon, hint, variant = "default", style }: Props) {
  const cellColor = theme.colors.cell[VARIANT_CELL[variant]];
  const iconColors = VARIANT_ICON[variant];
  return (
    <View style={[styles.cell, { backgroundColor: cellColor }, style]}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label} numberOfLines={1}>{label}</Text>
          <Text style={styles.value} numberOfLines={1}>{value}</Text>
          {hint ? <Text style={styles.hint} numberOfLines={1}>{hint}</Text> : null}
        </View>
        {Icon ? (
          <View style={[styles.iconBox, { backgroundColor: iconColors.bg }]}>
            <Icon size={18} color={iconColors.fg} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderRadius: theme.radius.md,
    padding: 16,
    ...theme.shadows.card,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  label: { fontSize: 10, textTransform: "uppercase" as const, letterSpacing: 0.6, fontWeight: theme.fontWeight.medium, color: theme.colors.muted },
  value: { fontSize: 22, fontWeight: theme.fontWeight.bold, color: theme.colors.foreground, marginTop: 4, letterSpacing: -0.3 },
  hint: { fontSize: 11, color: theme.colors.subtle, marginTop: 4 },
  iconBox: { width: 36, height: 36, borderRadius: theme.radius.md, justifyContent: "center", alignItems: "center" },
});
