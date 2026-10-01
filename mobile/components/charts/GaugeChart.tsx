// GaugeChart — jauge semi-circulaire
import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import { theme } from "@/constants/theme";

export function GaugeChart({ value, size = 200, thickness = 16, label, color = "#10B981" }: { value: number; size?: number; thickness?: number; label?: string; color?: string }) {
  const v = Math.max(0, Math.min(100, value));
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - (v / 100) * circumference;
  const trackPath = `M ${thickness / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - thickness / 2} ${cy}`;

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size / 2 + 10 }}>
        <Svg width={size} height={size / 2 + 10}>
          <Path d={trackPath} fill="none" stroke={theme.colors.border} strokeWidth={thickness} strokeLinecap="round" />
          <Path d={trackPath} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
        </Svg>
        <View style={styles.centerVal}>
          <Text style={[styles.val, { color }]}>{v.toFixed(0)}%</Text>
        </View>
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  centerVal: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center" },
  val: { fontSize: 28, fontWeight: "700" as const },
  label: { fontSize: 11, color: theme.colors.muted, marginTop: 4 },
});
