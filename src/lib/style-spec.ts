import type { LayerSpecification } from "@maplibre/maplibre-gl-style-spec";
import { latest } from "@maplibre/maplibre-gl-style-spec";

export const SUPPORTED_LAYER_TYPES = [
  "line",
  "fill",
  "circle",
  "symbol",
  "heatmap",
  "fill-extrusion",
] as const;

export type SupportedLayerType = (typeof SUPPORTED_LAYER_TYPES)[number];

export type EditorLayer = Extract<
  LayerSpecification,
  { type: SupportedLayerType }
>;

export type PropertyDescriptor =
  | {
      kind: "number";
      default: number;
      min: number;
      max: number;
      step: number;
      units?: string;
    }
  | { kind: "color"; default: string }
  | { kind: "boolean"; default: boolean }
  | { kind: "enum"; values: string[]; default: string }
  | { kind: "string"; default: string }
  | { kind: "number-array"; length?: number; default: number[]; units?: string }
  | { kind: "string-array"; default: string[] }
  | { kind: "json"; default: unknown };

type SpecProperty = {
  type: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  units?: string;
  values?: Record<string, unknown> | unknown[];
  value?: string;
  length?: number;
};

const SLIDER_MAX_BY_UNITS: Record<string, number> = {
  pixels: 100,
  ems: 8,
  "factor of the original icon size": 5,
  degrees: 360,
  meters: 1000,
};

function sliderRange(property: SpecProperty): {
  min: number;
  max: number;
  step: number;
} {
  const min = property.minimum ?? 0;
  const max =
    property.maximum ?? SLIDER_MAX_BY_UNITS[property.units ?? ""] ?? 100;
  const span = max - min;
  const step = span <= 2 ? 0.01 : span <= 40 ? 0.1 : 1;
  return { min, max, step };
}

function toDescriptor(property: SpecProperty): PropertyDescriptor {
  switch (property.type) {
    case "number": {
      if (typeof property.default !== "number") break;
      return {
        kind: "number",
        default: property.default,
        ...sliderRange(property),
        units: property.units,
      };
    }
    case "color": {
      if (typeof property.default !== "string") break;
      return { kind: "color", default: property.default };
    }
    case "boolean":
      return { kind: "boolean", default: property.default === true };
    case "enum": {
      const values = Array.isArray(property.values)
        ? property.values.map(String)
        : Object.keys(property.values ?? {});
      return {
        kind: "enum",
        values,
        default: String(property.default ?? values[0] ?? ""),
      };
    }
    case "string":
    case "formatted":
    case "resolvedImage":
      return { kind: "string", default: String(property.default ?? "") };
    case "array": {
      if (property.value === "number") {
        return {
          kind: "number-array",
          length: property.length,
          default: Array.isArray(property.default)
            ? (property.default as number[])
            : [],
          units: property.units,
        };
      }
      if (property.value === "string" || property.value === "enum") {
        return {
          kind: "string-array",
          default: Array.isArray(property.default)
            ? property.default.map(String)
            : [],
        };
      }
      break;
    }
  }
  return { kind: "json", default: property.default };
}

function descriptorsFor(
  group: "paint" | "layout",
  layerType: SupportedLayerType,
): Record<string, PropertyDescriptor> {
  const reference = latest as unknown as Record<
    string,
    Record<string, SpecProperty>
  >;
  const properties = reference[`${group}_${layerType}`] ?? {};
  const descriptors: Record<string, PropertyDescriptor> = {};
  for (const [name, property] of Object.entries(properties)) {
    descriptors[name] = toDescriptor(property);
  }
  return descriptors;
}

const paintCache = new Map<
  SupportedLayerType,
  Record<string, PropertyDescriptor>
>();
const layoutCache = new Map<
  SupportedLayerType,
  Record<string, PropertyDescriptor>
>();

export function paintProperties(
  layerType: SupportedLayerType,
): Record<string, PropertyDescriptor> {
  let descriptors = paintCache.get(layerType);
  if (!descriptors) {
    descriptors = descriptorsFor("paint", layerType);
    paintCache.set(layerType, descriptors);
  }
  return descriptors;
}

export function layoutProperties(
  layerType: SupportedLayerType,
): Record<string, PropertyDescriptor> {
  let descriptors = layoutCache.get(layerType);
  if (!descriptors) {
    descriptors = descriptorsFor("layout", layerType);
    layoutCache.set(layerType, descriptors);
  }
  return descriptors;
}

const STARTER_STYLES: Record<SupportedLayerType, Partial<EditorLayer>> = {
  line: {
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-color": "#7c9cf5", "line-width": 3 },
  },
  fill: {
    paint: { "fill-color": "#2a9d8f", "fill-opacity": 0.6 },
  },
  circle: {
    paint: {
      "circle-radius": 6,
      "circle-color": "#e76f51",
      "circle-stroke-width": 1.5,
      "circle-stroke-color": "#ffffff",
    },
  },
  symbol: {
    layout: {
      "text-field": "{name}",
      // The only font demotiles serves; MapTiler hosts it too, so labels
      // render on every basemap without configuration.
      "text-font": ["Open Sans Semibold"],
      "text-size": 12,
      "text-offset": [0, 0.8],
      "text-anchor": "top",
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-color": "#1a1a2e",
      "text-halo-width": 1.5,
    },
  },
  heatmap: {
    paint: { "heatmap-radius": 30, "heatmap-opacity": 0.8 },
  },
  "fill-extrusion": {
    paint: {
      "fill-extrusion-color": "#8ecae6",
      "fill-extrusion-height": 100,
      "fill-extrusion-opacity": 0.7,
    },
  },
};

export function createLayer(
  id: string,
  sourceId: string,
  type: SupportedLayerType,
): EditorLayer {
  return {
    id,
    source: sourceId,
    type,
    ...STARTER_STYLES[type],
  } as EditorLayer;
}

export function isSupportedLayerType(type: string): type is SupportedLayerType {
  return (SUPPORTED_LAYER_TYPES as readonly string[]).includes(type);
}
