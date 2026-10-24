import type { Angle } from "../math/expression-engine";
import { compileExpression } from "../math/expression-engine";
import { storage } from "../services/storage";
import type { EChartsType } from "echarts/core";
/** Amostra também o ponto médio: quebras de domínio e saltos não viram segmentos verticais. */
export function sampleFunction(
  expression: string,
  min: number,
  max: number,
  angle: Angle,
  count = 700,
): [number, number | null][] {
  const f = compileExpression(expression, true);
  const at = (x: number) => {
    try {
      const y = f.at(x, angle);
      return Math.abs(y) > 1e12 ? null : y;
    } catch {
      return null;
    }
  };
  const points: [number, number | null][] = [];
  let previous: number | null = null;
  for (let i = 0; i <= count; i++) {
    const x = min + ((max - min) * i) / count;
    let y = at(x);
    if (i && y !== null && previous !== null) {
      const mid = at(x - (max - min) / count / 2);
      const span = Math.abs(y - previous);
      const scale = 1 + Math.min(Math.abs(y), Math.abs(previous));
      if (
        mid === null ||
        span > 40 * scale ||
        (Math.sign(y) !== Math.sign(previous) &&
          span > 20 &&
          (Math.abs(mid) > Math.max(Math.abs(y), Math.abs(previous)) ||
            Math.abs(mid - (y + previous) / 2) > span * 0.2))
      )
        points.push([x - (max - min) / count / 2, null]);
    }
    points.push([x, y]);
    previous = y;
  }
  return points;
}
export async function renderChart(
  container: HTMLElement,
  series: { name: string; points: [number, number | null][] }[],
  opts: { area?: boolean; min?: number; max?: number } = {},
): Promise<() => void> {
  const { init } = await import("./chart-library");
  if (!container.isConnected) return () => {};

  const dark = storage.preferences.theme === "dark",
    ink = dark ? "#e7dce9" : "#655568",
    grid = dark ? "#49394b" : "#eee6ee";
  const chart: EChartsType = init(container, undefined, { renderer: "canvas" });
  chart.setOption({
    animation: false,
    color: ["#bc00a3", "#007f86", "#9a6d00"],
    textStyle: { fontFamily: "Manrope, sans-serif" },
    tooltip: {
      trigger: "axis",
      valueFormatter: (value: unknown) =>
        typeof value === "number"
          ? new Intl.NumberFormat("pt-BR", {
              maximumSignificantDigits: 8,
            }).format(value)
          : String(value),
    },
    legend: { show: series.length > 1, top: 0, textStyle: { color: ink } },
    grid: { top: series.length > 1 ? 42 : 24, left: 60, right: 25, bottom: 76 },
    xAxis: {
      type: "value",
      name: "x",
      min: opts.min,
      max: opts.max,
      axisLine: { onZero: true, lineStyle: { color: ink } },
      axisLabel: { color: ink, hideOverlap: true },
      splitLine: { lineStyle: { color: grid } },
    },
    yAxis: {
      type: "value",
      name: "f(x)",
      axisLabel: { color: ink },
      axisLine: { onZero: true, lineStyle: { color: ink } },
      splitLine: { lineStyle: { color: grid } },
      scale: true,
    },
    dataZoom: [
      { type: "inside", filterMode: "none" },
      {
        type: "slider",
        height: 20,
        bottom: 16,
        borderColor: grid,
        fillerColor: dark ? "#663757" : "#f3d4ec",
        handleStyle: { color: "#bc00a3" },
        textStyle: { color: ink },
      },
    ],
    series: series.map((s) => ({
      type: "line",
      name: s.name,
      data: s.points,
      showSymbol: false,
      connectNulls: false,
      lineStyle: { width: 2.5 },
      ...(opts.area ? { areaStyle: { opacity: 0.12 } } : {}),
    })),
  });
  const observer = new ResizeObserver(() => chart.resize());
  observer.observe(container);
  return () => {
    observer.disconnect();
    chart.dispose();
  };
}
