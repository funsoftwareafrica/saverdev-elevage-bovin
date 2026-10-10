// LineChart — courbes cattly via react-native-svg
import * as React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path, Line, Text as SvgText, Circle, G } from "react-native-svg";
import { theme } from "@/constants/theme";

export interface LineSeries {
  name: string;
  color: string;
  values: number[];
}

interface Props {
  labels: string[];
  series: LineSeries[];
  width?: number;
  height?: number;
}

export function LineChart({ labels, series, width = 320, height = 180 }: Props) {
  const padL = 8;
  const padR = 8;
  const padT = 8;
  const padB = 22;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const allValues = series.flatMap((s) => s.values);
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const range = max - min || 1;

  const n = labels.length;
  const stepX = chartW / Math.max(n - 1, 1);

  const toPoint = (val: number, i: number) => {
    const x = padL + i * stepX;
    const y = padT + chartH - ((val - min) / range) * chartH;
    return { x, y };
  };

  const buildPath = (vals: number[]) => {
    if (vals.length === 0) return "";
    const pts = vals.map((v, i) => toPoint(v, i));
    return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  };

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Svg width={width} height={height}>
        {/* Ligne zéro si min < 0 */}
        {min < 0 ? (
          <Line
            x1={padL}
            y1={padT + chartH - ((0 - min) / range) * chartH}
            x2={padL + chartW}
            y2={padT + chartH - ((0 - min) / range) * chartH}
            stroke={theme.colors.border}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        ) : null}
        {/* Labels X */}
        {labels.map((l, i) => (
          <SvgText key={i} x={padL + i * stepX} y={height - padB + 12} fontSize={9} fill={theme.colors.muted} textAnchor="middle">
            {l}
          </SvgText>
        ))}
        {/* Courbes */}
        {series.map((s, si) => (
          <G key={si}>
            <Path d={buildPath(s.values)} stroke={s.color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {s.values.map((v, i) => {
              const p = toPoint(v, i);
              return <Circle key={i} cx={p.x} cy={p.y} r={3} fill={theme.colors.card} stroke={s.color} strokeWidth={2} />;
            })}
          </G>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
});
