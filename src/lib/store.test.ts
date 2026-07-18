import { beforeEach, describe, expect, setSystemTime, test } from "bun:test";
import type { FeatureCollection } from "geojson";
import { resetToDemo, useEditorStore } from "./store";
import { createLayer } from "./style-spec";

const emptyCollection: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

function state() {
  return useEditorStore.getState();
}

let clock = Date.now();

beforeEach(() => {
  resetToDemo();
  useEditorStore.temporal.getState().clear();
  // Step past the undo-history throttle window so each test's first
  // mutation is recorded.
  clock += 10_000;
  setSystemTime(new Date(clock));
});

describe("demo state", () => {
  test("loads DC Metro sources and layers", () => {
    expect(Object.keys(state().sources)).toEqual([
      "dc-metro-lines",
      "dc-metro-stations",
    ]);
    expect(state().layerOrder.length).toBeGreaterThanOrEqual(2);
    for (const id of state().layerOrder) {
      expect(state().layers[id]).toBeDefined();
    }
  });
});

describe("layer operations", () => {
  test("addLayer appends to order", () => {
    state().addLayer(createLayer("extra", "dc-metro-lines", "line"));
    expect(state().layerOrder.at(-1)).toBe("extra");
    expect(state().layers.extra?.type).toBe("line");
  });

  test("duplicateLayer copies style under a fresh id", () => {
    const [first] = state().layerOrder;
    if (!first) throw new Error("no layers");
    state().duplicateLayer(first);
    const copyId = state().layerOrder.at(-1);
    expect(copyId).not.toBe(first);
    expect(state().layers[copyId ?? ""]?.type).toBe(
      state().layers[first]?.type,
    );
  });

  test("removeLayer deletes layer and order entry", () => {
    const [first] = state().layerOrder;
    if (!first) throw new Error("no layers");
    state().removeLayer(first);
    expect(state().layers[first]).toBeUndefined();
    expect(state().layerOrder).not.toContain(first);
  });

  test("renameLayer keeps position and refuses collisions", () => {
    const [first, second] = state().layerOrder;
    if (!first || !second) throw new Error("need two layers");
    expect(state().renameLayer(first, second)).toBe(false);
    expect(state().renameLayer(first, "renamed")).toBe(true);
    expect(state().layerOrder[0]).toBe("renamed");
    expect(state().layers.renamed?.id).toBe("renamed");
  });

  test("moveLayer shifts without wrapping", () => {
    const order = state().layerOrder;
    const first = order[0];
    if (!first) throw new Error("no layers");
    state().moveLayer(first, -1);
    expect(state().layerOrder[0]).toBe(first);
    state().moveLayer(first, 1);
    expect(state().layerOrder[1]).toBe(first);
  });

  test("setPaintProperty and setLayoutProperty update in place", () => {
    state().addLayer(createLayer("paint-me", "dc-metro-lines", "line"));
    state().setPaintProperty("paint-me", "line-color", "#123456");
    state().setLayoutProperty("paint-me", "line-cap", "square");
    const layer = state().layers["paint-me"];
    expect(layer?.paint).toMatchObject({ "line-color": "#123456" });
    expect(layer?.layout).toMatchObject({ "line-cap": "square" });
  });

  test("clearing a property removes the key entirely", () => {
    state().addLayer(createLayer("clear-me", "dc-metro-lines", "line"));
    state().setPaintProperty("clear-me", "line-color", "#123456");
    state().setPaintProperty("clear-me", "line-color", undefined);
    expect(state().layers["clear-me"]?.paint).not.toContainKey("line-color");
  });

  test("toggleVisibility flips layout visibility", () => {
    state().addLayer(createLayer("blinky", "dc-metro-lines", "line"));
    state().toggleVisibility("blinky");
    expect(state().layers.blinky?.layout?.visibility).toBe("none");
    state().toggleVisibility("blinky");
    expect(state().layers.blinky?.layout?.visibility).toBe("visible");
  });
});

describe("source operations", () => {
  test("addSource stores geojson data", () => {
    state().addSource("scratch", emptyCollection);
    expect(state().sources.scratch?.data).toEqual(emptyCollection);
  });

  test("removeSource cascades to dependent layers", () => {
    state().addSource("doomed", emptyCollection);
    state().addLayer(createLayer("dependent", "doomed", "circle"));
    state().removeSource("doomed");
    expect(state().sources.doomed).toBeUndefined();
    expect(state().layers.dependent).toBeUndefined();
    expect(state().layerOrder).not.toContain("dependent");
  });
});

describe("undo/redo", () => {
  test("undo reverts a layer addition, redo replays it", () => {
    const before = state().layerOrder.length;
    state().addLayer(createLayer("temporal", "dc-metro-lines", "line"));
    expect(state().layerOrder.length).toBe(before + 1);

    useEditorStore.temporal.getState().undo();
    expect(state().layerOrder.length).toBe(before);

    useEditorStore.temporal.getState().redo();
    expect(state().layerOrder.length).toBe(before + 1);
  });

  test("basemap changes are not tracked in history", () => {
    state().setBasemap("dark");
    const { pastStates } = useEditorStore.temporal.getState();
    expect(pastStates.length).toBe(0);
  });
});
