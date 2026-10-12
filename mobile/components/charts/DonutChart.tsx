// DonutChart — camembert creux cattly via react-native-svg (sans lib externe)
import * as React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { theme } from "@/constants/theme";

export interface DonutSlice {
  value: number;
  color: string;
  label: string;
}

// Convertit valeur/total → arc SVG path
function describeArc(cx: number, cy: number, rIn: number, rOut: number, startAngle: number, endAngle: number): string {
  const polar = (angle: number, r: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const startOuter = polar(startAngle, rOut);
  const endOuter = polar(endAngle, rOut);
  const startInner = polar(endAngle, rIn);
  const endInner = polar(startAngle, rIn);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOut} ${rOut} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${rIn} ${rIn} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

interface Props {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
}

export function DonutChart({ data, size = 180, thickness = 28 }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const rOut = size / 2 - 2;
  const rIn = rOut - thickness;

  const slices = data.reduce<
    Array<DonutSlice & { start: number; end: number }>
  >((acc, d) => {
    const start = acc.length > 0 ? acc[acc.length - 1].end : 0;
    const sweep = (d.value / total) * 360;
    const end = start + sweep;
    acc.push({ ...d, start, end });
    return acc;
  }, []);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G>
          {slices.map((s, i) => (
            <Path
              key={i}
              d={describeArc(cx, cy, rIn, rOut, s.start, s.end)}
              fill={s.color}
              stroke={theme.colors.card}
              strokeWidth={2}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
});
