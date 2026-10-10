// BarChart — barres verticales cattly via react-native-svg
import * as React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import { theme } from "@/constants/theme";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface Props {
  data: BarDatum[];
  width?: number;
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}

export function BarChart({ data, width = 320, height = 180, color = theme.colors.primary, formatValue }: Props) {
  const padLeft = 8;
  const padBottom = 22;
  const padTop = 8;
  const chartH = height - padBottom - padTop;
  const chartW = width - padLeft - 8;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = chartW / data.length;
  const barGap = barW * 0.3;

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Svg width={width} height={height}>
        {/* Ligne de base */}
        <Line x1={padLeft} y1={height - padBottom} x2={width - 4} y2={height - padBottom} stroke={theme.colors.border} strokeWidth={1} />
        {data.map((d, i) => {
          const h = (d.value / max) * chartH;
          const x = padLeft + i * barW + barGap / 2;
          const y = height - padBottom - h;
          const w = barW - barGap;
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={y} width={w} height={Math.max(h, 2)} rx={3} fill={d.color ?? color} />
              <SvgText
                x={x + w / 2}
                y={height - padBottom + 12}
                fontSize={9}
                fill={theme.colors.muted}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
              {formatValue && d.value > 0 ? (
                <SvgText x={x + w / 2} y={y - 4} fontSize={8} fill={theme.colors.subtle} textAnchor="middle">
                  {formatValue(d.value)}
                </SvgText>
              ) : null}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
});
