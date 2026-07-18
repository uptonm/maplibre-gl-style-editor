import { describe, expect, test } from "bun:test";
import type { FeatureCollection } from "geojson";
import { paintProperties, validatePropertyExpression } from "./style-spec";
import {
  analyzeProperties,
  buildColorExpression,
  colorTargetFor,
} from "./style-wizard";

const collection: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    { line: "red", riders: 120 },
    { line: "blue", riders: 80 },
    { line: "red", riders: 60 },
    { line: "green", riders: null },
  ].map((properties) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [0, 0] },
    properties,
  })),
};

describe("analyzeProperties", () => {
  test("classifies categorical and numeric properties", () => {
    const analyzed = analyzeProperties(collection);
    const line = analyzed.find((p) => p.name === "line");
    const riders = analyzed.find((p) => p.name === "riders");
    if (line?.kind !== "categorical") throw new Error("expected categorical");
    if (riders?.kind !== "numeric") throw new Error("expected numeric");
    expect(line.values).toEqual(["blue", "green", "red"]);
    expect(riders.min).toBe(60);
    expect(riders.max).toBe(120);
  });

  test("drops properties with too many categories", () => {
    const wide: FeatureCollection = {
      type: "FeatureCollection",
      features: Array.from({ length: 30 }, (_, i) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [0, 0] },
        properties: { id: `unique-${i}` },
      })),
    };
    expect(analyzeProperties(wide)).toEqual([]);
  });
});

describe("buildColorExpression", () => {
  const analyzed = analyzeProperties(collection);

  test("categorical properties become a match expression", () => {
    const line = analyzed.find((p) => p.name === "line");
    if (!line) throw new Error("missing line");
    const expression = buildColorExpression(line) as unknown[];
    expect(expression[0]).toBe("match");
    expect(expression[1]).toEqual(["get", "line"]);
    // 3 values * (value + color) + operator + input + fallback
    expect(expression.length).toBe(2 + 3 * 2 + 1);
  });

  test("numeric properties become an interpolate ramp", () => {
    const riders = analyzed.find((p) => p.name === "riders");
    if (!riders) throw new Error("missing riders");
    const expression = buildColorExpression(riders) as unknown[];
    expect(expression.slice(0, 3)).toEqual([
      "interpolate",
      ["linear"],
      ["get", "riders"],
    ]);
    expect(expression[3]).toBe(60);
  });

  test("generated expressions validate against the color property spec", () => {
    const circleColor = paintProperties("circle")["circle-color"];
    if (!circleColor) throw new Error("missing circle-color");
    for (const property of analyzed) {
      expect(
        validatePropertyExpression(
          circleColor,
          "circle-color",
          buildColorExpression(property),
        ),
      ).toEqual([]);
    }
  });
});

describe("colorTargetFor", () => {
  test("maps layer types to their color paint property", () => {
    expect(colorTargetFor("line")).toBe("line-color");
    expect(colorTargetFor("circle")).toBe("circle-color");
    expect(colorTargetFor("heatmap")).toBeNull();
  });
});
