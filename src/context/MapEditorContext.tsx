import type { FeatureCollection } from "@turf/turf";
import type {
  FilterSpecification,
  GeoJSONSourceSpecification,
} from "maplibre-gl";
import { FC, ReactNode, useTransition } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import useSWR from "swr";
import type {
  SupportedLayerSpecification,
  SupportedLayerType,
} from "../lib/types";
import { getInitialLayerStyle } from "../lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type MapEditorContextState = {
  sources: Record<string, GeoJSONSourceSpecification>;
  addSource: (sourceId: string) => void;
  setSourceData: (sourceId: string, data: FeatureCollection) => void;

  layers: Record<string, SupportedLayerSpecification>;
  layerOrder: string[];
  addLayer: (layer: SupportedLayerSpecification) => void;
  updateLayer: (layerId: string, layer: SupportedLayerSpecification) => void;
  moveLayerUp: (layerId: string) => void;
  moveLayerDown: (layerId: string) => void;
};

const initialMapEditorContextState: MapEditorContextState = {
  sources: {},
  addSource: () => {
    throw new Error("addSource not implemented");
  },
  setSourceData: () => {
    throw new Error("setSourceData not implemented");
  },
  layers: {},
  layerOrder: [],
  addLayer: () => {
    throw new Error("addLayer not implemented");
  },
  updateLayer: () => {
    throw new Error("setLayer not implemented");
  },
  moveLayerUp: () => {
    throw new Error("moveLayerUp not implemented");
  },
  moveLayerDown: () => {
    throw new Error("moveLayerDown not implemented");
  },
};

export const MapEditorContext = createContext<MapEditorContextState>(
  initialMapEditorContextState
);

type MapEditorContextProviderProps = {
  children: ReactNode;
};

export const MapEditorContextProvider: FC<MapEditorContextProviderProps> = ({
  children,
}) => {
  const [layers, setLayers] = useState<
    Record<string, SupportedLayerSpecification>
  >(initialMapEditorContextState.layers);
  const [layerOrder, setLayerOrder] = useState<string[]>(
    initialMapEditorContextState.layerOrder
  );
  const [sources, setSources] = useState<
    Record<string, GeoJSONSourceSpecification>
  >(initialMapEditorContextState.sources);

  const dcMetroLines = useSWR<FeatureCollection>(
    "/api/dc-metro?dataset=lines",
    fetcher
  );
  const dcMetroStations = useSWR<FeatureCollection>(
    "/api/dc-metro?dataset=stations",
    fetcher
  );

  const addSource = useCallback((sourceId: string) => {
    setSources((prevSources) => ({
      ...prevSources,
      [sourceId]: {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      },
    }));
  }, []);

  const setSourceData = useCallback(
    (sourceId: string, data: FeatureCollection) => {
      setSources((prevSources) => {
        const source = prevSources[sourceId];

        if (!source) {
          console.error("Source not found");
          return prevSources;
        }

        return {
          ...prevSources,
          [sourceId]: {
            ...source,
            data,
          },
        };
      });
    },
    []
  );

  const addLayer = (layer: SupportedLayerSpecification) => {
    setLayers((prevLayers) => ({
      ...prevLayers,
      [layer.id]: layer,
    }));
    setLayerOrder((prevLayerOrder) => [...prevLayerOrder, layer.id]);
  };

  const updateLayerId = useCallback(
    (oldLayerId: string, newLayerId: string) => {
      setLayers((prevLayers) => {
        const layer = prevLayers[oldLayerId];

        if (!layer) {
          console.error("Layer not found");
          return prevLayers;
        }

        const newLayers = { ...prevLayers };
        delete newLayers[oldLayerId];
        newLayers[newLayerId] = {
          ...layer,
          id: newLayerId,
        };

        return newLayers;
      });
      setLayerOrder((prevLayerOrder) => {
        const index = prevLayerOrder.indexOf(oldLayerId);
        const newLayerOrder = [...prevLayerOrder];
        newLayerOrder[index] = newLayerId;
        return newLayerOrder;
      });
    },
    []
  );

  const updateLayer = useCallback(
    (layerId: string, layer: SupportedLayerSpecification) => {
      if (layerId !== layer.id) {
        updateLayerId(layerId, layer.id);
      }
      setLayers((prevLayers) => {
        const newLayers = { ...prevLayers };
        newLayers[layer.id] = layer;
        return newLayers;
      });
    },
    [updateLayerId]
  );

  const moveLayerUp = useCallback((layerId: string) => {
    setLayerOrder((layerOrder) => {
      const index = layerOrder.indexOf(layerId);
      const newLayerOrder = [...layerOrder];

      if (index === -1) {
        return newLayerOrder;
      }

      if (index === 0) {
        newLayerOrder.shift();
        newLayerOrder.push(layerId);
        return newLayerOrder;
      }

      newLayerOrder[index] = newLayerOrder[index - 1]!;
      newLayerOrder[index - 1] = layerId;
      return newLayerOrder;
    });
  }, []);

  const moveLayerDown = useCallback((layerId: string) => {
    setLayerOrder((layerOrder) => {
      const index = layerOrder.indexOf(layerId);
      const newLayerOrder = [...layerOrder];

      if (index === -1) {
        return newLayerOrder;
      }

      if (index === newLayerOrder.length - 1) {
        newLayerOrder.pop();
        newLayerOrder.unshift(layerId);
        return newLayerOrder;
      }

      newLayerOrder[index] = newLayerOrder[index + 1]!;
      newLayerOrder[index + 1] = layerId;
      return newLayerOrder;
    });
  }, []);

  useEffect(() => {
    if (dcMetroLines.data && dcMetroStations.data) {
      addSource("dc-metro-lines");
      setSourceData("dc-metro-lines", dcMetroLines.data);
      addSource("dc-metro-stations");
      setSourceData("dc-metro-stations", dcMetroStations.data);

      addLayer(
        getInitialLayerStyle("dc-metro-lines", "dc-metro-lines", "line")
      );
      addLayer(
        getInitialLayerStyle("dc-metro-stations", "dc-metro-stations", "circle")
      );
    }
  }, [dcMetroLines.data, dcMetroStations.data, addSource, setSourceData]);

  return (
    <MapEditorContext.Provider
      value={{
        sources,
        addSource,
        setSourceData,
        layers,
        layerOrder,
        addLayer,
        updateLayer,
        moveLayerUp,
        moveLayerDown,
      }}
    >
      {children}
    </MapEditorContext.Provider>
  );
};

export const useMapEditorContext = () => {
  return useContext(MapEditorContext);
};
