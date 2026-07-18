import type { FeatureCollection } from "geojson";
import { temporal } from "zundo";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import dcMetroLines from "~/data/dc-metro-lines.json";
import dcMetroStations from "~/data/dc-metro-stations.json";
import type { BasemapId } from "./basemaps";
import type { EditorLayer } from "./style-spec";
import { createLayer } from "./style-spec";

export type EditorSource = {
  type: "geojson";
  data: FeatureCollection | string;
};

export type StyleState = {
  sources: Record<string, EditorSource>;
  layers: Record<string, EditorLayer>;
  layerOrder: string[];
};

export type EditorState = StyleState & {
  basemap: BasemapId;
  maptilerKey: string;

  addSource: (id: string, data: FeatureCollection | string) => void;
  removeSource: (id: string) => void;

  addLayer: (layer: EditorLayer) => void;
  updateLayer: (id: string, patch: Partial<EditorLayer>) => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  renameLayer: (id: string, newId: string) => boolean;
  moveLayer: (id: string, direction: -1 | 1) => void;
  setPaintProperty: (id: string, property: string, value: unknown) => void;
  setLayoutProperty: (id: string, property: string, value: unknown) => void;
  toggleVisibility: (id: string) => void;

  replaceStyle: (style: StyleState) => void;
  setBasemap: (basemap: BasemapId) => void;
  setMaptilerKey: (key: string) => void;
};

function demoStyle(): StyleState {
  const lines = dcMetroLines as FeatureCollection;
  const stations = dcMetroStations as FeatureCollection;
  const labels = createLayer("metro-labels", "dc-metro-stations", "symbol");
  labels.layout = { ...labels.layout, "text-field": "{NAME}" };
  return {
    sources: {
      "dc-metro-lines": { type: "geojson", data: lines },
      "dc-metro-stations": { type: "geojson", data: stations },
    },
    layers: {
      "metro-lines": createLayer("metro-lines", "dc-metro-lines", "line"),
      "metro-stations": createLayer(
        "metro-stations",
        "dc-metro-stations",
        "circle",
      ),
      "metro-labels": labels,
    },
    layerOrder: ["metro-lines", "metro-stations", "metro-labels"],
  };
}

function withProperty(
  layer: EditorLayer,
  group: "paint" | "layout",
  property: string,
  value: unknown,
): EditorLayer {
  const properties = { ...(layer[group] ?? {}) } as Record<string, unknown>;
  if (value === undefined) {
    delete properties[property];
  } else {
    properties[property] = value;
  }
  return { ...layer, [group]: properties } as EditorLayer;
}

export function uniqueId(base: string, taken: Record<string, unknown>): string {
  if (!(base in taken)) return base;
  let n = 2;
  while (`${base}-${n}` in taken) n += 1;
  return `${base}-${n}`;
}

const memoryStorage = (() => {
  const backing = new Map<string, string>();
  return {
    getItem: (key: string) => backing.get(key) ?? null,
    setItem: (key: string, value: string) => void backing.set(key, value),
    removeItem: (key: string) => void backing.delete(key),
  };
})();

export const useEditorStore = create<EditorState>()(
  temporal(
    persist(
      (set, get) => ({
        ...demoStyle(),
        basemap: "demotiles",
        maptilerKey: "",

        addSource: (id, data) =>
          set((state) => ({
            sources: { ...state.sources, [id]: { type: "geojson", data } },
          })),

        removeSource: (id) =>
          set((state) => {
            const sources = { ...state.sources };
            delete sources[id];
            const layers = { ...state.layers };
            const removed = Object.values(layers)
              .filter((layer) => layer.source === id)
              .map((layer) => layer.id);
            for (const layerId of removed) delete layers[layerId];
            return {
              sources,
              layers,
              layerOrder: state.layerOrder.filter(
                (layerId) => !removed.includes(layerId),
              ),
            };
          }),

        addLayer: (layer) =>
          set((state) => ({
            layers: { ...state.layers, [layer.id]: layer },
            layerOrder: [...state.layerOrder, layer.id],
          })),

        updateLayer: (id, patch) =>
          set((state) => {
            const layer = state.layers[id];
            if (!layer) return state;
            return {
              layers: {
                ...state.layers,
                [id]: { ...layer, ...patch, id } as EditorLayer,
              },
            };
          }),

        removeLayer: (id) =>
          set((state) => {
            const layers = { ...state.layers };
            delete layers[id];
            return {
              layers,
              layerOrder: state.layerOrder.filter((layerId) => layerId !== id),
            };
          }),

        duplicateLayer: (id) => {
          const layer = get().layers[id];
          if (!layer) return;
          const copyId = uniqueId(`${id}-copy`, get().layers);
          get().addLayer({ ...layer, id: copyId } as EditorLayer);
        },

        renameLayer: (id, newId) => {
          const { layers } = get();
          if (!layers[id] || newId === id) return newId === id;
          if (!newId || newId in layers) return false;
          set((state) => {
            const nextLayers = { ...state.layers };
            const layer = nextLayers[id];
            if (!layer) return state;
            delete nextLayers[id];
            nextLayers[newId] = { ...layer, id: newId } as EditorLayer;
            return {
              layers: nextLayers,
              layerOrder: state.layerOrder.map((layerId) =>
                layerId === id ? newId : layerId,
              ),
            };
          });
          return true;
        },

        moveLayer: (id, direction) =>
          set((state) => {
            const index = state.layerOrder.indexOf(id);
            const target = index + direction;
            if (index === -1 || target < 0 || target >= state.layerOrder.length)
              return state;
            const layerOrder = [...state.layerOrder];
            layerOrder[index] = layerOrder[target] as string;
            layerOrder[target] = id;
            return { layerOrder };
          }),

        setPaintProperty: (id, property, value) =>
          set((state) => {
            const layer = state.layers[id];
            if (!layer) return state;
            return {
              layers: {
                ...state.layers,
                [id]: withProperty(layer, "paint", property, value),
              },
            };
          }),

        setLayoutProperty: (id, property, value) =>
          set((state) => {
            const layer = state.layers[id];
            if (!layer) return state;
            return {
              layers: {
                ...state.layers,
                [id]: withProperty(layer, "layout", property, value),
              },
            };
          }),

        toggleVisibility: (id) => {
          const layer = get().layers[id];
          if (!layer) return;
          const hidden = layer.layout?.visibility === "none";
          get().setLayoutProperty(
            id,
            "visibility",
            hidden ? "visible" : "none",
          );
        },

        replaceStyle: (style) => set(() => ({ ...style })),
        setBasemap: (basemap) => set(() => ({ basemap })),
        setMaptilerKey: (maptilerKey) => set(() => ({ maptilerKey })),
      }),
      {
        name: "maplibre-style-editor",
        storage: createJSONStorage(() =>
          typeof localStorage === "undefined" ? memoryStorage : localStorage,
        ),
        partialize: (state) => ({
          sources: state.sources,
          layers: state.layers,
          layerOrder: state.layerOrder,
          basemap: state.basemap,
          maptilerKey: state.maptilerKey,
        }),
      },
    ),
    {
      limit: 100,
      partialize: (state) => ({
        sources: state.sources,
        layers: state.layers,
        layerOrder: state.layerOrder,
      }),
      equality: (past, current) =>
        past.sources === current.sources &&
        past.layers === current.layers &&
        past.layerOrder === current.layerOrder,
      // Collapse rapid slider drags into one undo step instead of hundreds.
      handleSet: (record) => {
        let lastRecordedAt = 0;
        return (state) => {
          const now = Date.now();
          if (now - lastRecordedAt < 300) return;
          lastRecordedAt = now;
          record(state);
        };
      },
    },
  ),
);

export function resetToDemo(): void {
  useEditorStore.getState().replaceStyle(demoStyle());
}
