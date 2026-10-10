// Button — bouton cattly (primary emerald, outline, ghost)
import * as React from "react";
import { TouchableOpacity, Text, StyleSheet, type ViewStyle, type TextStyle } from "react-native";
import { theme } from "@/constants/theme";

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = "primary", size = "md", icon, style, textStyle, disabled }: Props) {
  const bg = {
    primary: theme.colors.primary,
    outline: "transparent",
    ghost: "transparent",
    danger: theme.colors.destructive,
  }[variant];
  const fg = variant === "outline" || variant === "ghost" ? theme.colors.foreground : theme.colors.primaryFg;
  const border = variant === "outline" ? theme.colors.border : "transparent";

  const padding = { sm: { pv: 6, ph: 12 }, md: { pv: 10, ph: 16 }, lg: { pv: 14, ph: 20 } }[size];
  const fontSize = { sm: 12, md: 14, lg: 16 }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        { backgroundColor: bg, borderColor: border, paddingVertical: padding.pv, paddingHorizontal: padding.ph, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      {icon ? <>{icon}<View style={{ width: 6 }} /></> : null}
      <Text style={[styles.label, { color: fg, fontSize }, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

import { View } from "react-native";

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  label: { fontWeight: "600", textAlign: "center" },
});
