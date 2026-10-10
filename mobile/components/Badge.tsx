// Badge — pastille colorée (statuts, sévérités)
import * as React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  label: string;
  bg: string;
  fg: string;
  border?: string;
  size?: "sm" | "md";
}

export function Badge({ label, bg, fg, border, size = "sm" }: Props) {
  return (
    <View style={[styles.base, { backgroundColor: bg, borderColor: border ?? bg }, size === "sm" ? styles.sm : styles.md]}>
      <Text style={[styles.text, { color: fg }, size === "sm" ? styles.textSm : styles.textMd]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" },
  sm: {},
  md: { paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontWeight: "500" },
  textSm: { fontSize: 10 },
  textMd: { fontSize: 12 },
});
