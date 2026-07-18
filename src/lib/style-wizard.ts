import type { FeatureCollection } from "geojson";
import type { SupportedLayerType } from "./style-spec";

export type AnalyzedProperty =
  | { name: string; kind: "categorical"; values: string[] }
  | { name: string; kind: "numeric"; min: number; max: number };

const MAX_CATEGORIES = 12;

// Okabe–Ito: colorblind-safe categorical palette.
const CATEGORICAL_COLORS = [
  "#e69f00",
  "#56b4e9",
  "#009e73",
  "#f0e442",
  "#0072b2",
  "#d55e00",
  "#cc79a7",
  "#999999",
  "#8dd3c7",
  "#bc80bd",
  "#fb8072",
  "#80b1d3",
];

const RAMP_LOW = "#fde725";
const RAMP_HIGH = "#440154";
const FALLBACK_COLOR = "#aaaaaa";

export function analyzeProperties(data: FeatureCollection): AnalyzedProperty[] {
  const valuesByName = new Map<string, unknown[]>();
  for (const feature of data.features) {
    for (const [name, value] of Object.entries(feature.properties ?? {})) {
      if (value === null || value === undefined) continue;
      let values = valuesByName.get(name);
      if (!values) {
        values = [];
        valuesByName.set(name, values);
      }
      values.push(value);
    }
  }

  const analyzed: AnalyzedProperty[] = [];
  for (const [name, values] of valuesByName) {
    if (values.length === 0) continue;
    if (values.every((value) => typeof value === "number")) {
      const numbers = values as number[];
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      if (min !== max) analyzed.push({ name, kind: "numeric", min, max });
      continue;
    }
    if (values.every((value) => typeof value === "string")) {
      const distinct = [...new Set(values as string[])].sort();
      if (distinct.length >= 2 && distinct.length <= MAX_CATEGORIES) {
        analyzed.push({ name, kind: "categorical", values: distinct });
      }
    }
  }
  return analyzed.sort((a, b) => a.name.localeCompare(b.name));
}

export function categoricalColorPairs(
  property: Extract<AnalyzedProperty, { kind: "categorical" }>,
): [string, string][] {
  return property.values.map((value, index) => [
    value,
    CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length] as string,
  ]);
}

export function buildColorExpression(property: AnalyzedProperty): unknown[] {
  if (property.kind === "numeric") {
    return [
      "interpolate",
      ["linear"],
      ["get", property.name],
      property.min,
      RAMP_LOW,
      property.max,
      RAMP_HIGH,
    ];
  }
  return [
    "match",
    ["get", property.name],
    ...categoricalColorPairs(property).flat(),
    FALLBACK_COLOR,
  ];
}

export const RAMP_COLORS = { low: RAMP_LOW, high: RAMP_HIGH };

const COLOR_TARGETS: Record<SupportedLayerType, string | null> = {
  line: "line-color",
  fill: "fill-color",
  circle: "circle-color",
  symbol: "text-color",
  // heatmap-color only accepts a heatmap-density ramp; the wizard's
  // feature-data expressions don't apply.
  heatmap: null,
  "fill-extrusion": "fill-extrusion-color",
};

export function colorTargetFor(type: SupportedLayerType): string | null {
  return COLOR_TARGETS[type];
}
