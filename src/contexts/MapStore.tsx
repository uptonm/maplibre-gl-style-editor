"use client";

import { observable } from "@legendapp/state";
import { type BBox, type FeatureCollection } from "geojson";
import type { GeoJSONSourceSpecification } from "maplibre-gl";
import type { SupportedLayerSpecification } from "~/lib/map-types";
import { getInitialLayerStyle } from "~/lib/map-utils";
import { syncObservable } from "@legendapp/state/sync";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { enableReactUse } from "@legendapp/state/config/enableReactUse";
import { bbox, featureCollection } from "@turf/turf";

enableReactUse();

type MapStore = {
  isInitialized: boolean;
  sources: Record<string, GeoJSONSourceSpecification>;
  layers: Record<string, SupportedLayerSpecification>;
  layerOrder: string[];
  bounds: BBox | null;
  __recalculateBounds: () => void;
  addSource: (sourceId: string, data: FeatureCollection) => void;
  setSourceData: (sourceId: string, data: FeatureCollection) => void;
  addLayer: (layer: SupportedLayerSpecification) => void;
  __updateLayerId: (oldLayerId: string, newLayerId: string) => void;
  updateLayer: (layerId: string, layer: SupportedLayerSpecification) => void;
  moveLayerUp: (layerId: string) => void;
  moveLayerDown: (layerId: string) => void;
  __initializeSources: (
    dcMetroLines: FeatureCollection,
    dcMetroStations: FeatureCollection,
  ) => void;
  __initializeLayers: () => void;
  __initialize: (
    dcMetroLines: FeatureCollection,
    dcMetroStations: FeatureCollection,
  ) => void;
  resetLayers: () => void;
};

export const mapStore$ = observable<MapStore>({
  isInitialized: false,
  sources: {},
  layers: {},
  layerOrder: [],
  bounds: null,
  __recalculateBounds: () => {
    const features: GeoJSON.Feature[] = [];
    Object.values(mapStore$.sources.get()).forEach((source) => {
      if (source.data) {
        features.push(...(source.data as GeoJSON.FeatureCollection).features);
      }
    });
    mapStore$.bounds.set(bbox(featureCollection(features)));
  },
  addSource: (sourceId: string, data: FeatureCollection) => {
    mapStore$.sources[sourceId]!.set({
      type: "geojson",
      data,
    });
    mapStore$.__recalculateBounds();
  },
  setSourceData: (sourceId: string, data: FeatureCollection) => {
    const source = mapStore$.sources[sourceId];

    if (!source) {
      console.error("Source not found");
      return;
    }

    mapStore$.sources[sourceId]!.set({
      ...source.get(),
      data,
    } satisfies GeoJSONSourceSpecification);
    mapStore$.__recalculateBounds();
  },
  addLayer: (layer: SupportedLayerSpecification) => {
    const layers = { ...mapStore$.layers.get() };
    layers[layer.id] = layer;

    const layerOrder = [...mapStore$.layerOrder.get()];
    layerOrder.push(layer.id);

    // @ts-expect-error - this type is excessively deep and possibly infinite
    mapStore$.layers.set(layers);
    mapStore$.layerOrder.set(layerOrder);
  },
  __updateLayerId: (oldLayerId: string, newLayerId: string) => {
    const layers = { ...mapStore$.layers.get() };
    const layerOrder = [...mapStore$.layerOrder.get()];

    const layer = layers[oldLayerId];

    if (!layer) {
      console.error("Layer not found");
      return;
    }

    delete layers[oldLayerId];
    layers[newLayerId] = { ...layer, id: newLayerId };
    mapStore$.layers.set(layers);

    const index = layerOrder.indexOf(oldLayerId);
    layerOrder[index] = newLayerId;
    mapStore$.layerOrder.set(layerOrder);
  },
  updateLayer: (layerId: string, layer: SupportedLayerSpecification) => {
    const layers = { ...mapStore$.layers.get() };
    if (layerId !== layer.id) {
      mapStore$.__updateLayerId(layerId, layer.id);
    }
    layers[layer.id] = layer;
    mapStore$.layers.set(layers);
  },
  moveLayerUp: (layerId: string) => {
    const layerOrder = [...mapStore$.layerOrder.get()];
    const index = layerOrder.indexOf(layerId);

    if (index === -1) {
      // layer not found
      return;
    }

    if (index === 0) {
      layerOrder.shift();
      layerOrder.push(layerId);
    } else {
      layerOrder[index] = layerOrder[index - 1]!;
      layerOrder[index - 1] = layerId;
    }

    console.log(layerOrder);

    mapStore$.layerOrder.set(layerOrder);
  },
  moveLayerDown: (layerId: string) => {
    const layerOrder = [...mapStore$.layerOrder.get()];
    const index = layerOrder.indexOf(layerId);

    if (index === -1) {
      // layer not found
      return;
    }

    if (index === layerOrder.length - 1) {
      layerOrder.pop();
      layerOrder.unshift(layerId);
    } else {
      layerOrder[index] = layerOrder[index + 1]!;
      layerOrder[index + 1] = layerId;
    }

    console.log(layerOrder);

    mapStore$.layerOrder.set(layerOrder);
  },
  __initializeSources: (
    dcMetroLines: FeatureCollection,
    dcMetroStations: FeatureCollection,
  ) => {
    mapStore$.addSource("dc-metro-lines", dcMetroLines);
    mapStore$.addSource("dc-metro-stations", dcMetroStations);
  },
  __initializeLayers: () => {
    mapStore$.addLayer(
      getInitialLayerStyle("dc-metro-lines", "dc-metro-lines", "line"),
    );
    mapStore$.addLayer(
      getInitialLayerStyle(
        "dc-metro-stations-vertex",
        "dc-metro-stations",
        "circle",
      ),
    );
  },
  __initialize: (
    dcMetroLines: FeatureCollection,
    dcMetroStations: FeatureCollection,
  ) => {
    if (mapStore$.isInitialized.get()) {
      return;
    }

    mapStore$.isInitialized.set(true);
    mapStore$.__initializeSources(dcMetroLines, dcMetroStations);
    mapStore$.__initializeLayers();
  },
  resetLayers: () => {
    mapStore$.layers.set({});
    mapStore$.layerOrder.set([]);
    mapStore$.__initializeLayers();
  },
});

syncObservable(mapStore$, {
  persist: {
    name: "map-store",
    plugin: ObservablePersistLocalStorage,
  },
});
