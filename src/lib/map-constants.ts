import { LineLayerSpecification } from "maplibre-gl";
import type {
  SupportedLayerPaintProperty,
  SupportedLayerSpecification,
  SupportedLayerType,
} from "./map-types";

export const SupportedLayerTypes: SupportedLayerType[] = [
  "line",
  "fill",
  "symbol",
  "circle",
  // "fill-extrusion",
  // "raster",
  // "background",
  // "hillshade",
  // "heatmap",
];

export const InitialLineLayerStyle: SupportedLayerSpecification = {
  id: "line",
  source: "line",
  type: "line",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": "#888",
    "line-width": 8,
  },
};

export const InitialFillLayerStyle: SupportedLayerSpecification = {
  id: "fill",
  source: "fill",
  type: "fill",
  layout: {},
  paint: {
    "fill-color": "#088",
    "fill-opacity": 0.8,
  },
};

export const InitialSymbolLayerStyle: SupportedLayerSpecification = {
  id: "symbol",
  source: "symbol",
  type: "symbol",
  layout: {
    "text-field": "{title}",
    "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
    "text-offset": [0, 0.6],
    "text-anchor": "top",
  },
  paint: {
    "text-color": "#fff",
    "text-halo-color": "#000",
    "text-halo-width": 2,
  },
};

export const InitialCircleLayerStyle: SupportedLayerSpecification = {
  id: "circle",
  source: "circle",
  type: "circle",
  layout: {},
  paint: {
    "circle-radius": 10,
    "circle-color": "#f00",
  },
};
