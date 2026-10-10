// Section — titre de section avec icône
import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "@/constants/theme";
import type { LucideIcon } from "lucide-react-native";

export function SectionTitle({ icon: Icon, title, subtitle }: { icon?: LucideIcon; title: string; subtitle?: string }) {
  return (
    <View style={styles.wrap}>
      {Icon ? <Icon size={16} color={theme.colors.primary} /> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>— {subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  title: { fontSize: 14, fontWeight: "600", color: theme.colors.foreground },
  subtitle: { fontSize: 11, color: theme.colors.muted, flexShrink: 1 },
});
