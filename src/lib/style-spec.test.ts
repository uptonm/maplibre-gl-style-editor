import { describe, expect, test } from "bun:test";
import {
  createLayer,
  isExpressionValue,
  layoutProperties,
  paintProperties,
  SUPPORTED_LAYER_TYPES,
  validateFilter,
  validatePropertyExpression,
} from "./style-spec";

describe("paintProperties", () => {
  test("covers every supported layer type", () => {
    for (const type of SUPPORTED_LAYER_TYPES) {
      expect(Object.keys(paintProperties(type)).length).toBeGreaterThan(0);
    }
  });

  test("derives a bounded number descriptor for line-opacity", () => {
    const descriptor = paintProperties("line")["line-opacity"];
    expect(descriptor).toMatchObject({
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

describe("expression support metadata", () => {
  test("data-driven paint properties carry expression support", () => {
    const width = paintProperties("line")["line-width"];
    expect(width?.expression?.interpolated).toBe(true);
    expect(width?.expression?.parameters).toContain("feature");
  });

  test("zoom-only properties do not advertise feature parameters", () => {
    const translate = paintProperties("line")["line-translate"];
    expect(translate?.expression?.parameters).toEqual(["zoom"]);
  });
});

describe("isExpressionValue", () => {
  test("plain values are not expressions", () => {
    expect(isExpressionValue("#ff0000")).toBe(false);
    expect(isExpressionValue(3)).toBe(false);
    expect(isExpressionValue(true)).toBe(false);
    expect(isExpressionValue(undefined)).toBe(false);
  });

  test("value arrays are not expressions", () => {
    expect(isExpressionValue([0, 0])).toBe(false);
    expect(isExpressionValue(["Open Sans Semibold"])).toBe(false);
  });

  test("expression arrays are expressions", () => {
    expect(isExpressionValue(["get", "width"])).toBe(true);
    expect(isExpressionValue(["literal", [0, 0]])).toBe(true);
    expect(
      isExpressionValue(["interpolate", ["linear"], ["zoom"], 0, 1, 10, 4]),
    ).toBe(true);
  });

  test("legacy function objects count as expressions for editing", () => {
    expect(isExpressionValue({ stops: [[0, 1]] })).toBe(true);
  });
});

describe("validatePropertyExpression", () => {
  const width = paintProperties("line")["line-width"];
  const translate = paintProperties("line")["line-translate"];
  if (!width || !translate) throw new Error("missing descriptors");

  test("accepts a valid zoom interpolation", () => {
    expect(
      validatePropertyExpression(width, "line-width", [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        1,
        15,
        8,
      ]),
    ).toEqual([]);
  });

  test("accepts a data expression on a data-driven property", () => {
    expect(
      validatePropertyExpression(width, "line-width", ["get", "width"]),
    ).toEqual([]);
  });

  test("rejects the wrong return type", () => {
    const errors = validatePropertyExpression(width, "line-width", [
      "concat",
      "a",
      "b",
    ]);
    expect(errors.join(" ")).toContain("Expected number");
  });

  test("rejects data expressions on zoom-only properties", () => {
    const errors = validatePropertyExpression(translate, "line-translate", [
      "get",
      "offset",
    ]);
    expect(errors.join(" ")).toContain("data expressions not supported");
  });

  test("rejects unknown operators with a helpful message", () => {
    const errors = validatePropertyExpression(width, "line-width", [
      "not-an-op",
      1,
    ]);
    expect(errors.join(" ")).toContain("Unknown expression");
  });

  test("plain values validate clean", () => {
    expect(validatePropertyExpression(width, "line-width", 3)).toEqual([]);
    expect(
      validatePropertyExpression(translate, "line-translate", [0, 0]),
    ).toEqual([]);
  });
});

describe("validateFilter", () => {
  test("accepts expression filters", () => {
    expect(validateFilter(["==", ["get", "LINE"], "red"])).toEqual([]);
  });

  test("leaves legacy filters alone", () => {
    expect(validateFilter(["==", "LINE", "red"])).toEqual([]);
  });

  test("rejects invalid expression filters", () => {
    const errors = validateFilter(["==", ["get", "LINE"]]);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("plain array values on array-like properties", () => {
  test("font stacks are not treated as expressions", () => {
    const font = layoutProperties("symbol")["text-font"];
    if (!font) throw new Error("missing text-font");
    expect(
      validatePropertyExpression(font, "text-font", ["Open Sans Semibold"]),
    ).toEqual([]);
  });

  test("variable anchor offsets pass as plain values", () => {
    const offsets = layoutProperties("symbol")["text-variable-anchor-offset"];
    if (!offsets) throw new Error("missing text-variable-anchor-offset");
    expect(
      validatePropertyExpression(offsets, "text-variable-anchor-offset", [
        "top",
        [0, 1],
      ]),
    ).toEqual([]);
  });

  test("junk in a number tuple gets a real error", () => {
    const translate = paintProperties("line")["line-translate"];
    if (!translate) throw new Error("missing line-translate");
    expect(
      validatePropertyExpression(translate, "line-translate", ["not-an-op", 1])
        .length,
    ).toBeGreaterThan(0);
  });
});
