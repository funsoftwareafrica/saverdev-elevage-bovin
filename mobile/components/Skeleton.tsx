// Skeleton — état de chargement cattly
import * as React from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";
import { theme } from "@/constants/theme";

export function Skeleton({ style }: { style?: ViewStyle }) {
  return <View style={[styles.base, style]} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.hairline,
    borderRadius: theme.radius.sm,
  },
});
