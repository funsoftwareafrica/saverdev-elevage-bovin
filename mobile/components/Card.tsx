// Card — carte crème cattly avec ombre douce + radius 16
import * as React from "react";
import { View, StyleSheet, type ViewProps } from "react-native";
import { theme } from "@/constants/theme";

export function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

import { Text } from "react-native";

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: theme.fontWeight.semibold, color: theme.colors.foreground },
  subtitle: { fontSize: 11, color: theme.colors.muted, marginTop: 2 },
});
