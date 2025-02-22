import { bbox, featureCollection } from "@turf/turf";
import { LngLatBounds } from "maplibre-gl";
import {
  InitialCircleLayerStyle,
  InitialFillLayerStyle,
  InitialLineLayerStyle,
  InitialSymbolLayerStyle,
} from "./map-constants";
import type {
  SupportedLayerSpecification,
  SupportedLayerType,
} from "./map-types";

export function getInitialLayerStyle(
  layerId: string,
  sourceId: string,
  layerType: SupportedLayerType,
): SupportedLayerSpecification {
  switch (layerType) {
    case "line":
      return { ...InitialLineLayerStyle, id: layerId, source: sourceId };
    case "fill":
      return { ...InitialFillLayerStyle, id: layerId, source: sourceId };
    case "symbol":
      return { ...InitialSymbolLayerStyle, id: layerId, source: sourceId };
    case "circle":
      return { ...InitialCircleLayerStyle, id: layerId, source: sourceId };
  }
}

export function getLayerPaintProperties(
  layerType: SupportedLayerType,
): string[] {
  switch (layerType) {
    case "line":
      return [
        "line-opacity",
        "line-color",
        "line-translate",
        "line-translate-anchor",
        "line-width",
        "line-gap-width",
        "line-offset",
        "line-blur",
        "line-dasharray",
        "line-pattern",
      ];
    case "fill":
      return [
        "fill-antialias",
        "fill-opacity",
        "fill-color",
        "fill-outline-color",
        "fill-translate",
        "fill-translate-anchor",
        "fill-pattern",
      ];
    case "symbol":
      return [
        "icon-opacity",
        "icon-color",
        "icon-halo-color",
        "icon-halo-width",
        "icon-halo-blur",
        "icon-translate",
        "icon-translate-anchor",
        "text-opacity",
        "text-color",
        "text-halo-color",
        "text-halo-width",
        "text-halo-blur",
        "text-translate",
        "text-translate-anchor",
      ];
    case "circle":
      return [
        "circle-radius",
        "circle-color",
        "circle-blur",
        "circle-opacity",
        "circle-translate",
        "circle-translate-anchor",
        "circle-pitch-scale",
        "circle-pitch-alignment",
        "circle-stroke-width",
        "circle-stroke-color",
        "circle-stroke-opacity",
      ];
  }
}

export type PropertyValue =
  | { type: "string"; default: string }
  | { type: "color"; default: string }
  | { type: "boolean"; default: boolean }
  | {
      type: "number";
      default: number;
      min?: number;
      max?: number;
      step?: number;
    }
  | { type: "enum"; values: string[]; default: string }
  | { type: "tuple"; types: { name: string }[]; default: number[] }
  | { type: "array"; valueType: PropertyValue; default: unknown[] };

export function getLayerPaintPropertyValue(
  layerType: SupportedLayerType,
  property: string,
): PropertyValue | undefined {
  switch (layerType) {
    case "line": {
      switch (property) {
        case "line-opacity": {
          return { type: "number", min: 0, max: 1, step: 0.01, default: 1 };
        }
        case "line-color": {
          return { type: "color", default: "#000000" };
        }
        case "line-translate": {
          return {
            type: "tuple",
            types: [{ name: "x" }, { name: "y" }],
            default: [0, 0],
          };
        }
        case "line-translate-anchor": {
          return { type: "enum", values: ["map", "viewport"], default: "map" };
        }
        case "line-width": {
          return { type: "number", min: 0, max: 100, step: 1, default: 1 };
        }
        case "line-gap-width": {
          return { type: "number", min: 0, max: 100, step: 1, default: 0 };
        }
        case "line-offset": {
          return { type: "number", min: 0, max: 100, step: 1, default: 0 };
        }
        case "line-blur": {
          return { type: "number", min: 0, max: 100, step: 1, default: 0 };
        }
        case "line-dasharray": {
          return { type: "number", min: 0, max: 100, step: 1, default: 0 };
        }
        case "line-pattern": {
          return { type: "string", default: "" };
        }
        case "line-gradient": {
          return { type: "string", default: "" };
        }
      }
    }
    case "circle": {
      switch (property) {
        case "circle-radius": {
          return { type: "number", min: 0, max: 100, step: 1, default: 5 };
        }
        case "circle-color": {
          return { type: "color", default: "#000000" };
        }
        case "circle-blur": {
          return { type: "number", min: 0, max: 100, step: 1, default: 0 };
        }
        case "circle-opacity": {
          return { type: "number", min: 0, max: 1, step: 0.01, default: 1 };
        }
        case "circle-translate": {
          return {
            type: "tuple",
            types: [{ name: "x" }, { name: "y" }],
            default: [0, 0],
          };
        }
        case "circle-translate-anchor": {
          return { type: "enum", values: ["map", "viewport"], default: "map" };
        }
        case "circle-pitch-scale": {
          return { type: "enum", values: ["map", "viewport"], default: "map" };
        }
        case "circle-pitch-alignment": {
          return { type: "enum", values: ["map", "viewport"], default: "map" };
        }
        case "circle-stroke-width": {
          return { type: "number", min: 0, max: 100, step: 1, default: 1 };
        }
        case "circle-stroke-color": {
          return { type: "color", default: "#000000" };
        }
        case "circle-stroke-opacity": {
          return { type: "number", min: 0, max: 1, step: 0.01, default: 1 };
        }
      }
    }
    case "fill": {
      switch (property) {
        case "fill-antialias": {
          return { type: "boolean", default: true };
        }
        case "fill-opacity": {
          return { type: "number", min: 0, max: 1, step: 0.01, default: 1 };
        }
        case "fill-color": {
          return { type: "color", default: "#000000" };
        }
        case "fill-outline-color": {
          return { type: "color", default: "#000000" };
        }
        case "fill-translate": {
          return {
            type: "tuple",
            types: [{ name: "x" }, { name: "y" }],
            default: [0, 0],
          };
        }
        case "fill-translate-anchor": {
          return { type: "enum", values: ["map", "viewport"], default: "map" };
        }
        case "fill-pattern": {
          return { type: "string", default: "" };
        }
      }
    }
    case "symbol": {
      switch (property) {
        case "icon-opacity": {
          return { type: "number", min: 0, max: 1, step: 0.01, default: 1 };
        }
        case "icon-color": {
          return { type: "color", default: "#000000" };
        }
        case "icon-halo-color": {
          return { type: "color", default: "#000000" };
        }
        case "icon-halo-width": {
          return { type: "number", min: 0, max: 100, step: 1, default: 0 };
        }
        case "icon-halo-blur": {
          return { type: "number", min: 0, max: 100, step: 1, default: 0 };
        }
        case "icon-translate": {
          return {
            type: "tuple",
            types: [{ name: "x" }, { name: "y" }],
            default: [0, 0],
          };
        }
        case "icon-translate-anchor": {
          return { type: "enum", values: ["map", "viewport"], default: "map" };
        }
        case "text-opacity": {
          return { type: "number", min: 0, max: 1, step: 0.01, default: 1 };
        }
        case "text-color": {
          return { type: "color", default: "#000000" };
        }
        case "text-halo-color": {
          return { type: "color", default: "#000000" };
        }
        case "text-halo-width": {
          return { type: "number", min: 0, max: 100, step: 1, default: 0 };
        }
        case "text-halo-blur": {
          return { type: "number", min: 0, max: 100, step: 1, default: 0 };
        }
        case "text-translate": {
          return {
            type: "tuple",
            types: [{ name: "x" }, { name: "y" }],
            default: [0, 0],
          };
        }
        case "text-translate-anchor": {
          return { type: "enum", values: ["map", "viewport"], default: "map" };
        }
      }
    }
  }
}

export function setLayerPaintProperty(
  layer: SupportedLayerSpecification,
  property: keyof typeof layer.paint,
  value: (typeof layer.paint)[keyof typeof layer.paint],
): typeof layer {
  return {
    ...layer,
    paint: {
      ...layer.paint,
      [property]: value,
    },
  } as typeof layer;
}

export function getLayerLayoutProperties(
  layerType: SupportedLayerType,
): string[] {
  switch (layerType) {
    case "line": {
      return [
        "line-cap",
        "line-join",
        "line-miter-limit",
        "line-round-limit",
        "line-sort-key",
        "visibility",
      ];
    }
    case "circle": {
      return ["circle-sort-key", "visibility"];
    }
    case "fill": {
      return ["fill-sort-key", "visibility"];
    }
    case "symbol": {
      return [
        "symbol-sort-key",
        "symbol-placement",
        "symbol-spacing",
        "symbol-avoid-edges",
        "symbol-z-order",
        "icon-allow-overlap",
        "icon-ignore-placement",
        "icon-optional",
        "icon-rotation-alignment",
        "icon-size",
        "icon-text-fit",
        "icon-text-fit-padding",
        "icon-image",
        "icon-keep-upright",
        "icon-offset",
        "icon-anchor",
        "icon-pitch-alignment",
        "text-pitch-alignment",
        "text-rotation-alignment",
        "text-field",
        "text-font",
        "text-size",
        "text-max-width",
        "text-line-height",
        "text-letter-spacing",
        "text-justify",
        "text-anchor",
        "text-max-angle",
        "text-rotate",
        "text-padding",
        "text-keep-upright",
        "text-transform",
        "text-offset",
        "text-allow-overlap",
        "text-ignore-placement",
        "text-optional",
        "visibility",
      ];
    }
  }
}

export function getLayerLayoutPropertyValue(
  layerType: SupportedLayerType,
  property: string,
): PropertyValue | undefined {
  switch (layerType) {
    case "line": {
      switch (property) {
        case "line-cap": {
          return {
            type: "enum",
            values: ["butt", "round", "square"],
            default: "butt",
          };
        }
        case "line-join": {
          return {
            type: "enum",
            values: ["bevel", "round", "miter"],
            default: "miter",
          };
        }
        case "line-miter-limit": {
          return { type: "number", min: 0, max: 10, step: 0.1, default: 2 };
        }
        case "line-round-limit": {
          return { type: "number", min: 0, max: 10, step: 0.1, default: 1 };
        }
        case "line-sort-key": {
          return { type: "number", default: 0 };
        }
        case "visibility": {
          return {
            type: "enum",
            values: ["visible", "none"],
            default: "visible",
          };
        }
      }
    }
    case "circle": {
      switch (property) {
        case "circle-sort-key": {
          return { type: "number", default: 0 };
        }
        case "visibility": {
          return {
            type: "enum",
            values: ["visible", "none"],
            default: "visible",
          };
        }
      }
    }
    case "fill": {
      switch (property) {
        case "fill-sort-key": {
          return { type: "number", default: 0 };
        }
        case "visibility": {
          return {
            type: "enum",
            values: ["visible", "none"],
            default: "visible",
          };
        }
      }
    }
    case "symbol": {
      switch (property) {
        case "symbol-placement": {
          return {
            type: "enum",
            values: ["point", "line", "line-center"],
            default: "point",
          };
        }
        case "symbol-spacing": {
          return { type: "number", min: 0, max: 100, step: 1, default: 250 };
        }
        case "symbol-avoid-edges": {
          return { type: "boolean", default: false };
        }
        case "symbol-sort-key": {
          return { type: "number", default: 0 };
        }
        case "symbol-z-order": {
          return {
            type: "enum",
            values: ["auto", "viewport-y", "source"],
            default: "auto",
          };
        }
        case "icon-allow-overlap": {
          return { type: "boolean", default: false };
        }
        case "icon-ignore-placement": {
          return { type: "boolean", default: false };
        }
        case "icon-optional": {
          return { type: "boolean", default: false };
        }
        case "icon-rotation-alignment": {
          return {
            type: "enum",
            values: ["map", "viewport", "auto"],
            default: "auto",
          };
        }
        case "icon-size": {
          return { type: "number", min: 0, max: 10, step: 0.1, default: 1 };
        }
        case "icon-text-fit": {
          return {
            type: "enum",
            values: ["none", "both", "width", "height"],
            default: "none",
          };
        }
        case "icon-text-fit-padding": {
          return {
            type: "tuple",
            types: [
              { name: "top" },
              { name: "right" },
              { name: "bottom" },
              { name: "left" },
            ],
            default: [0, 0, 0, 0],
          };
        }
        case "icon-image": {
          return { type: "string", default: "" };
        }
        case "icon-rotate": {
          return { type: "number", min: 0, max: 360, step: 1, default: 0 };
        }
        case "icon-padding": {
          return { type: "number", min: 0, max: 100, step: 1, default: 2 };
        }
        case "icon-keep-upright": {
          return { type: "boolean", default: false };
        }
        case "icon-offset": {
          return {
            type: "tuple",
            types: [{ name: "x" }, { name: "y" }],
            default: [0, 0],
          };
        }
        case "icon-anchor": {
          return {
            type: "enum",
            values: [
              "center",
              "left",
              "right",
              "top",
              "bottom",
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
            ],
            default: "center",
          };
        }
        case "icon-pitch-alignment": {
          return {
            type: "enum",
            values: ["map", "viewport", "auto"],
            default: "auto",
          };
        }
        case "text-pitch-alignment": {
          return {
            type: "enum",
            values: ["map", "viewport", "auto"],
            default: "auto",
          };
        }
        case "text-rotation-alignment": {
          return {
            type: "enum",
            values: ["map", "viewport", "auto"],
            default: "auto",
          };
        }
        case "text-field": {
          return { type: "string", default: "" };
        }
        case "text-font": {
          return {
            type: "array",
            valueType: { type: "string", default: "Open Sans Regular" },
            default: ["Open Sans Regular", "Arial Unicode MS Regular"],
          };
        }
        case "text-size": {
          return { type: "number", min: 0, max: 100, step: 1, default: 16 };
        }
        case "text-max-width": {
          return { type: "number", min: 0, max: 100, step: 1, default: 10 };
        }
        case "text-line-height": {
          return { type: "number", min: 0, max: 10, step: 0.1, default: 1.2 };
        }
        case "text-letter-spacing": {
          return { type: "number", min: 0, max: 10, step: 0.1, default: 0 };
        }
        case "text-justify": {
          return {
            type: "enum",
            values: ["left", "center", "right"],
            default: "center",
          };
        }
        case "text-radial-offset": {
          return { type: "number", min: 0, max: 10, step: 0.1, default: 0 };
        }
        case "text-variable-anchor": {
          return {
            type: "array",
            valueType: {
              type: "enum",
              values: [
                "center",
                "left",
                "right",
                "top",
                "bottom",
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
              ],
              default: "center",
            },
            default: [
              "center",
              "left",
              "right",
              "top",
              "bottom",
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
            ],
          };
        }
        case "text-justify": {
          return {
            type: "enum",
            values: ["left", "center", "right"],
            default: "center",
          };
        }
        case "text-anchor": {
          return {
            type: "enum",
            values: [
              "center",
              "left",
              "right",
              "top",
              "bottom",
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
            ],
            default: "center",
          };
        }
        case "text-max-angle": {
          return { type: "number", min: 0, max: 45, step: 1, default: 45 };
        }
        case "text-writing-mode": {
          return {
            type: "array",
            valueType: {
              type: "enum",
              values: ["horizontal", "vertical"],
              default: "horizontal",
            },
            default: ["horizontal"],
          };
        }
        case "text-rotate": {
          return { type: "number", min: 0, max: 360, step: 1, default: 0 };
        }
        case "text-padding": {
          return { type: "number", min: 0, max: 100, step: 1, default: 2 };
        }
        case "text-keep-upright": {
          return { type: "boolean", default: false };
        }
        case "text-transform": {
          return {
            type: "enum",
            values: ["none", "uppercase", "lowercase"],
            default: "none",
          };
        }
        case "text-offset": {
          return {
            type: "tuple",
            types: [{ name: "x" }, { name: "y" }],
            default: [0, 0],
          };
        }
        case "text-allow-overlap": {
          return { type: "boolean", default: false };
        }
        case "text-ignore-placement": {
          return { type: "boolean", default: false };
        }
        case "text-optional": {
          return { type: "boolean", default: false };
        }
        case "visibility": {
          return {
            type: "enum",
            values: ["visible", "none"],
            default: "visible",
          };
        }
      }
    }
  }
}

export function setLayerLayoutProperty(
  layer: SupportedLayerSpecification,
  property: keyof typeof layer.layout,
  value: (typeof layer.layout)[keyof typeof layer.layout],
): typeof layer {
  return {
    ...layer,
    layout: {
      ...layer.layout,
      [property]: value,
    },
  } as typeof layer;
}
