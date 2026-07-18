import { describe, expect, test } from "bun:test";
import { decodeShareHash, encodeShareHash, SHARE_WARN_LENGTH } from "./share";
import type { StyleState } from "./store";
import { createLayer } from "./style-spec";

const state: StyleState = {
  sources: {
    points: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [-77, 38.9] },
            properties: { name: "test" },
          },
        ],
      },
    },
  },
  layers: { dots: createLayer("dots", "points", "circle") },
  layerOrder: ["dots"],
};

describe("share hash", () => {
  test("round-trips editor state", () => {
    const hash = encodeShareHash(state);
    expect(hash.startsWith("#s=")).toBe(true);
    const decoded = decodeShareHash(hash);
    expect(decoded).toEqual(state);
  });

  test("rejects garbage hashes", () => {
    expect(decodeShareHash("#s=!!!not-base64!!!")).toBeNull();
    expect(decodeShareHash("#other")).toBeNull();
    expect(decodeShareHash("")).toBeNull();
  });

  test("rejects decoded payloads that are not editor state", () => {
    const hash = encodeShareHash({ hello: "world" } as unknown as StyleState);
    expect(decodeShareHash(hash)).toBeNull();
  });

  test("warn threshold is generous enough for small styles", () => {
    expect(encodeShareHash(state).length).toBeLessThan(SHARE_WARN_LENGTH);
  });
});
