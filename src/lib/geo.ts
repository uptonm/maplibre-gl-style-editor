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
