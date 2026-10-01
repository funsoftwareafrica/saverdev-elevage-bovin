// Logo SAVERDEV — SVG via react-native-svg
import * as React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Rect, Ellipse, Path } from "react-native-svg";
import { theme } from "@/constants/theme";

export function SaverdevLogo({ size = 40 }: { size?: number }) {
  return (
    <View style={styles.row}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="47" fill="#FFFFFF" stroke="#111827" strokeWidth="5" />
        <Rect x="47" y="52" width="6" height="22" fill="#111827" rx="2" />
        <Ellipse cx="50" cy="40" rx="22" ry="18" fill="#10B981" />
        <Ellipse cx="38" cy="44" rx="12" ry="10" fill="#10B981" />
        <Ellipse cx="62" cy="44" rx="12" ry="10" fill="#10B981" />
        <Ellipse cx="50" cy="32" rx="13" ry="11" fill="#10B981" />
        <Path d="M16 78 Q30 72 50 78 T84 78" stroke="#34D399" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <Path d="M16 84 Q30 78 50 84 T84 84" stroke="#14B8A6" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
}
const styles = StyleSheet.create({ row: { flexDirection: "row", alignItems: "center" } });
