import type {
  LayerSpecification,
  StyleSpecification,
} from "@maplibre/maplibre-gl-style-spec";
import { DEMOTILES_GLYPHS } from "./basemaps";
import type { EditorSource, StyleState } from "./store";
import type { EditorLayer } from "./style-spec";
import { isSupportedLayerType } from "./style-spec";

export type BuildStyleOptions = {
  inlineData: boolean;
  name?: string;
};

export function buildStyle(
  state: StyleState,
  options: BuildStyleOptions,
): StyleSpecification {
  const sources: StyleSpecification["sources"] = {};
  for (const [id, source] of Object.entries(state.sources)) {
    const data =
      options.inlineData || typeof source.data === "string"
        ? source.data
        : `https://example.com/${id}.geojson`;
    sources[id] = { type: "geojson", data };
  }
  return {
    version: 8,
    name: options.name ?? "MapLibre Style Editor export",
    glyphs: DEMOTILES_GLYPHS,
    sources,
    layers: exportLayers(state),
  };
}

export function exportLayers(state: StyleState): EditorLayer[] {
  return state.layerOrder
    .map((id) => state.layers[id])
    .filter((layer): layer is EditorLayer => layer !== undefined);
}

export type ParseStyleResult =
  | { ok: true; state: StyleState; warnings: string[] }
  | { ok: false; error: string };

export function parseStyle(json: string): ParseStyleResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "Not valid JSON." };
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("layers" in parsed) ||
    !("sources" in parsed)
  ) {
    return {
      ok: false,
      error:
        "Expected a MapLibre style document with `sources` and `layers` keys.",
    };
  }

  const style = parsed as StyleSpecification;
  const warnings: string[] = [];
  const sources: Record<string, EditorSource> = {};

  for (const [id, source] of Object.entries(style.sources ?? {})) {
    if (source.type === "geojson" && source.data !== undefined) {
      sources[id] = {
        type: "geojson",
        data: source.data as EditorSource["data"],
      };
    } else {
      warnings.push(
        `Skipped source "${id}": only GeoJSON sources are supported.`,
      );
    }
  }

  const layers: Record<string, EditorLayer> = {};
  const layerOrder: string[] = [];
  for (const layer of (style.layers ?? []) as LayerSpecification[]) {
    if (
      !isSupportedLayerType(layer.type) ||
      !("source" in layer) ||
      !(layer.source in sources)
    ) {
      warnings.push(
        `Skipped layer "${layer.id}": unsupported type or missing source.`,
      );
      continue;
    }
    layers[layer.id] = layer as EditorLayer;
    layerOrder.push(layer.id);
  }

  return { ok: true, state: { sources, layers, layerOrder }, warnings };
}
