import turfBbox from "@turf/bbox";
import type { Feature, FeatureCollection } from "geojson";
import type { EditorSource } from "./store";

export type Bounds = [number, number, number, number];

export function dataBounds(
  sources: Record<string, EditorSource>,
): Bounds | null {
  const features: Feature[] = [];
  for (const source of Object.values(sources)) {
    if (typeof source.data === "object" && "features" in source.data) {
      features.push(...source.data.features);
    }
  }
  if (features.length === 0) return null;
  const collection: FeatureCollection = {
    type: "FeatureCollection",
    features,
  };
  const [west, south, east, north] = turfBbox(collection);
  if (![west, south, east, north].every(Number.isFinite)) return null;
  return [west, south, east, north] as Bounds;
}

export function describeCollection(data: FeatureCollection | string): string {
  if (typeof data === "string") return data;
  const types = [...new Set(data.features.map((f) => f.geometry?.type))]
    .filter(Boolean)
    .join(", ");
  const count = data.features.length;
  return `${count} feature${count === 1 ? "" : "s"}${types ? ` · ${types}` : ""}`;
}

const GEOMETRY_TYPES = [
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
  "GeometryCollection",
];

export function coerceFeatureCollection(
  parsed: unknown,
): FeatureCollection | null {
  if (typeof parsed !== "object" || parsed === null) return null;
  const value = parsed as { type?: string };
  if (value.type === "FeatureCollection") return value as FeatureCollection;
  if (value.type === "Feature") {
    return {
      type: "FeatureCollection",
      features: [value as Feature],
    };
  }
  if (typeof value.type === "string" && GEOMETRY_TYPES.includes(value.type)) {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: value as Feature["geometry"],
          properties: {},
        },
      ],
    };
  }
  return null;
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/\.(geo)?json$/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "source"
  );
}

// One starter layer type per geometry family present in the data, in
// bottom-to-top draw order.
export function layerTypesForData(
  data: FeatureCollection,
): ("fill" | "line" | "circle")[] {
  const kinds = new Set(
    data.features.map((feature) => feature.geometry?.type ?? ""),
  );
  const types: ("fill" | "line" | "circle")[] = [];
  if (kinds.has("Polygon") || kinds.has("MultiPolygon")) types.push("fill");
  if (kinds.has("LineString") || kinds.has("MultiLineString"))
    types.push("line");
  if (kinds.has("Point") || kinds.has("MultiPoint")) types.push("circle");
  return types;
}
