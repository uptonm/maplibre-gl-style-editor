import type { StyleSpecification } from "@maplibre/maplibre-gl-style-spec";

export const DEMOTILES_GLYPHS =
  "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf";

export type BasemapId =
  | "demotiles"
  | "blank"
  | "streets"
  | "light"
  | "dark"
  | "satellite"
  | "outdoor";

type Basemap = {
  id: BasemapId;
  label: string;
  requiresKey: boolean;
  maptilerStyleId?: string;
};

export const BASEMAPS: Basemap[] = [
  { id: "demotiles", label: "MapLibre demo (no key)", requiresKey: false },
  { id: "blank", label: "Blank (no key)", requiresKey: false },
  {
    id: "streets",
    label: "MapTiler Streets",
    requiresKey: true,
    maptilerStyleId: "streets-v2",
  },
  {
    id: "light",
    label: "MapTiler Light",
    requiresKey: true,
    maptilerStyleId: "dataviz-light",
  },
  {
    id: "dark",
    label: "MapTiler Dark",
    requiresKey: true,
    maptilerStyleId: "dataviz-dark",
  },
  {
    id: "satellite",
    label: "MapTiler Satellite",
    requiresKey: true,
    maptilerStyleId: "hybrid",
  },
  {
    id: "outdoor",
    label: "MapTiler Outdoor",
    requiresKey: true,
    maptilerStyleId: "outdoor-v2",
  },
];

const BLANK_STYLE: StyleSpecification = {
  version: 8,
  name: "Blank",
  glyphs: DEMOTILES_GLYPHS,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#e8e6e1" },
    },
  ],
};

export function envMaptilerKey(): string {
  // Must stay a plain process.env member access: that's the only pattern
  // Bun.build's env option statically inlines. import.meta.env and optional
  // chaining both survive to the browser, where they resolve to nothing.
  return process.env.BUN_PUBLIC_MAPTILER_API_KEY ?? "";
}

export function resolveBasemapStyle(
  id: BasemapId,
  maptilerKey: string,
): string | StyleSpecification {
  const basemap = BASEMAPS.find((candidate) => candidate.id === id);
  const key = maptilerKey || envMaptilerKey();
  if (!basemap || (basemap.requiresKey && !key)) {
    return id === "blank"
      ? BLANK_STYLE
      : "https://demotiles.maplibre.org/style.json";
  }
  if (!basemap.requiresKey) {
    return id === "blank"
      ? BLANK_STYLE
      : "https://demotiles.maplibre.org/style.json";
  }
  return `https://api.maptiler.com/maps/${basemap.maptilerStyleId}/style.json?key=${key}`;
}
