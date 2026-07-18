import { describe, expect, test } from "bun:test";
import type { StyleSpecification } from "@maplibre/maplibre-gl-style-spec";
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import type { FeatureCollection } from "geojson";
import type { StyleState } from "./store";
import { buildStyle, exportLayers, parseStyle } from "./style-io";
import { createLayer } from "./style-spec";

const pointCollection: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [-77, 38.9] },
      properties: { name: "test" },
    },
  ],
};

const sampleState: StyleState = {
  sources: {
    points: { type: "geojson", data: pointCollection },
    remote: { type: "geojson", data: "https://example.com/data.geojson" },
  },
  layers: {
    dots: createLayer("dots", "points", "circle"),
    labels: createLayer("labels", "points", "symbol"),
  },
  layerOrder: ["dots", "labels"],
};

describe("buildStyle", () => {
  test("produces a valid style with inline data", () => {
    const style = buildStyle(sampleState, { inlineData: true });
    expect(validateStyleMin(style)).toEqual([]);
    expect(style.version).toBe(8);
    expect(style.layers.map((layer) => layer.id)).toEqual(["dots", "labels"]);
    const points = style.sources.points;
    expect(points).toMatchObject({ type: "geojson" });
    expect((points as { data: unknown }).data).toEqual(pointCollection);
  });

  test("replaces inline data with placeholders when not inlining", () => {
    const style = buildStyle(sampleState, { inlineData: false });
    expect((style.sources.points as { data: unknown }).data).toBe(
      "https://example.com/points.geojson",
    );
    expect((style.sources.remote as { data: unknown }).data).toBe(
      "https://example.com/data.geojson",
    );
  });

  test("includes glyphs so symbol layers work out of the box", () => {
    const style = buildStyle(sampleState, { inlineData: true });
    expect(style.glyphs).toContain("{fontstack}");
  });
});

describe("exportLayers", () => {
  test("returns layers in draw order", () => {
    const layers = exportLayers(sampleState);
    expect(layers.map((layer) => layer.id)).toEqual(["dots", "labels"]);
  });
});

describe("parseStyle", () => {
  test("round-trips buildStyle output", () => {
    const style = buildStyle(sampleState, { inlineData: true });
    const result = parseStyle(JSON.stringify(style));
    if (!result.ok) throw new Error(result.error);
    expect(Object.keys(result.state.sources)).toEqual(["points", "remote"]);
    expect(result.state.layerOrder).toEqual(["dots", "labels"]);
    expect(result.warnings).toEqual([]);
  });

  test("skips unsupported sources and layers with warnings", () => {
    const style: StyleSpecification = {
      version: 8,
      sources: {
        vector: { type: "vector", url: "https://example.com/tiles.json" },
        points: { type: "geojson", data: pointCollection },
      },
      layers: [
        { id: "roads", type: "line", source: "vector" },
        { id: "hills", type: "hillshade", source: "vector" },
        { id: "dots", type: "circle", source: "points" },
      ],
    };
    const result = parseStyle(JSON.stringify(style));
    if (!result.ok) throw new Error(result.error);
    expect(Object.keys(result.state.sources)).toEqual(["points"]);
    expect(result.state.layerOrder).toEqual(["dots"]);
    expect(result.warnings.length).toBe(3);
  });

  test("rejects invalid JSON", () => {
    const result = parseStyle("{nope");
    expect(result.ok).toBe(false);
  });

  test("rejects JSON that is not a style", () => {
    const result = parseStyle(JSON.stringify({ hello: "world" }));
    expect(result.ok).toBe(false);
  });

  test("accepts a bare layers array as a partial import", () => {
    const layers = exportLayers(sampleState);
    const result = parseStyle(JSON.stringify(layers));
    expect(result.ok).toBe(false);
  });
});
