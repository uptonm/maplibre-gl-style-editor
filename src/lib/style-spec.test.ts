import { describe, expect, test } from "bun:test";
import {
  createLayer,
  layoutProperties,
  paintProperties,
  SUPPORTED_LAYER_TYPES,
} from "./style-spec";

describe("paintProperties", () => {
  test("covers every supported layer type", () => {
    for (const type of SUPPORTED_LAYER_TYPES) {
      expect(Object.keys(paintProperties(type)).length).toBeGreaterThan(0);
    }
  });

  test("derives a bounded number descriptor for line-opacity", () => {
    const descriptor = paintProperties("line")["line-opacity"];
    expect(descriptor).toEqual({
      kind: "number",
      default: 1,
      min: 0,
      max: 1,
      step: 0.01,
      units: undefined,
    });
  });

  test("gives unbounded numbers a usable slider range", () => {
    const descriptor = paintProperties("line")["line-width"];
    if (descriptor?.kind !== "number") throw new Error("expected number");
    expect(descriptor.min).toBe(0);
    expect(descriptor.max).toBeGreaterThan(1);
  });

  test("derives color descriptors", () => {
    expect(paintProperties("fill")["fill-color"]).toMatchObject({
      kind: "color",
      default: "#000000",
    });
  });

  test("derives enum descriptors with values", () => {
    const descriptor = layoutProperties("line")["line-cap"];
    expect(descriptor).toMatchObject({
      kind: "enum",
      values: ["butt", "round", "square"],
      default: "butt",
    });
  });

  test("derives fixed-length number tuples", () => {
    expect(paintProperties("line")["line-translate"]).toMatchObject({
      kind: "number-array",
      length: 2,
      default: [0, 0],
    });
  });

  test("derives string arrays for text-font", () => {
    expect(layoutProperties("symbol")["text-font"]).toMatchObject({
      kind: "string-array",
    });
  });

  test("treats expression-valued defaults as json", () => {
    expect(paintProperties("heatmap")["heatmap-color"]).toMatchObject({
      kind: "json",
    });
  });

  test("treats image and formatted types as strings", () => {
    expect(paintProperties("line")["line-pattern"]).toMatchObject({
      kind: "string",
    });
    expect(layoutProperties("symbol")["text-field"]).toMatchObject({
      kind: "string",
    });
  });
});

describe("createLayer", () => {
  test("creates a styled starter layer for each type", () => {
    for (const type of SUPPORTED_LAYER_TYPES) {
      const layer = createLayer(`test-${type}`, "test-source", type);
      expect(layer.id).toBe(`test-${type}`);
      expect(layer.type).toBe(type);
      expect(layer.source).toBe("test-source");
    }
  });

  test("symbol starter renders a visible label", () => {
    const layer = createLayer("labels", "s", "symbol");
    expect(
      (layer.layout as Record<string, unknown>)["text-field"],
    ).toBeTruthy();
  });
});
