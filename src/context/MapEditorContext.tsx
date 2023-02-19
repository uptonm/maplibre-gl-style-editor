import type { FeatureCollection } from "@turf/turf";
import type {
  FilterSpecification,
  GeoJSONSourceSpecification,
} from "maplibre-gl";
import type { FC, ReactNode } from "react";
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
  layers: Record<string, SupportedLayerSpecification>;
  sources: Record<string, GeoJSONSourceSpecification>;
  setLayerSource: (layerId: string, sourceId: string) => void;
  setLayerType: (layerId: string, layerType: SupportedLayerType) => void;
  setLayerMinZoom: (layerId: string, zoom: number) => void;
  setLayerMaxZoom: (layerId: string, zoom: number) => void;
  setLayerFilter: (layerId: string, filter: string) => void;
  setLayerPaintProperty: (
    layerId: string,
    paintProperty: string,
    value: unknown
  ) => void;
  setLayerLayoutProperty: (
    layerId: string,
    layoutProperty: string,
    value: unknown
  ) => void;
};

const initialMapEditorContextState: MapEditorContextState = {
  layers: {},
  sources: {},
  setLayerSource: () => {
    throw new Error("setLayerSource not implemented");
  },
  setLayerType: () => {
    throw new Error("setLayerType not implemented");
  },
  setLayerMinZoom: () => {
    throw new Error("setLayerMinZoom not implemented");
  },
  setLayerMaxZoom: () => {
    throw new Error("setLayerMaxZoom not implemented");
  },
  setLayerFilter: () => {
    throw new Error("setLayerFilter not implemented");
  },
  setLayerPaintProperty: () => {
    throw new Error("setLayerPaintProperty not implemented");
  },
  setLayerLayoutProperty: () => {
    throw new Error("setLayerLayoutProperty not implemented");
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

  const addSource = (sourceId: string, source: GeoJSONSourceSpecification) => {
    setSources((prevSources) => ({
      ...prevSources,
      [sourceId]: source,
    }));
  };

  const addLayer = (layer: SupportedLayerSpecification) => {
    setLayers((prevLayers) => ({
      ...prevLayers,
      [layer.id]: layer,
    }));
  };

  const setLayerSource = useCallback(
    (layerId: string, sourceId: string) => {
      setLayers((prevLayers) => {
        const layer = prevLayers[layerId];
        const source = sources[sourceId];

        if (!layer) {
          console.error("Layer not found");
          return prevLayers;
        }

        if (!source) {
          console.error("Source not found");
          return prevLayers;
        }

        return {
          ...prevLayers,
          [layerId]: {
            ...layer,
            source: sourceId,
          },
        };
      });
    },
    [sources]
  );

  const setLayerType = useCallback(
    (layerId: string, layerType: SupportedLayerType) => {
      setLayers((prevLayers) => {
        const layer = prevLayers[layerId];

        if (!layer) {
          console.error("Layer not found");
          return prevLayers;
        }

        const initialStyleForLayer = getInitialLayerStyle(
          layer.id,
          layer.source,
          layerType
        );

        return {
          ...prevLayers,
          [layerId]: {
            ...layer,
            ...initialStyleForLayer,
          } as SupportedLayerSpecification,
        };
      });
    },
    []
  );

  const setLayerMinZoom = useCallback((layerId: string, zoom: number) => {
    setLayers((prevLayers) => {
      const layer = prevLayers[layerId];

      if (!layer) {
        console.error("Layer not found");
        return prevLayers;
      }

      return {
        ...prevLayers,
        [layerId]: {
          ...layer,
          minzoom: zoom,
        },
      };
    });
  }, []);

  const setLayerMaxZoom = useCallback((layerId: string, zoom: number) => {
    setLayers((prevLayers) => {
      const layer = prevLayers[layerId];

      if (!layer) {
        console.error("Layer not found");
        return prevLayers;
      }

      return {
        ...prevLayers,
        [layerId]: {
          ...layer,
          maxzoom: zoom,
        },
      };
    });
  }, []);

  const setLayerFilter = useCallback((layerId: string, filter: string) => {
    setLayers((prevLayers) => {
      const layer = prevLayers[layerId];

      if (!layer) {
        console.error("Layer not found");
        return prevLayers;
      }

      let parsedFilter: FilterSpecification;
      try {
        parsedFilter = JSON.parse(filter) as FilterSpecification;
      } catch (err) {
        console.error("Invalid filter");
        return prevLayers;
      }

      return {
        ...prevLayers,
        [layerId]: {
          ...layer,
          filter: parsedFilter,
        },
      };
    });
  }, []);

  const setLayerPaintProperty = useCallback(
    (layerId: string, paintProperty: string, value: unknown) => {
      setLayers((prevLayers) => {
        const layer = prevLayers[layerId];

        if (!layer) {
          console.error("Layer not found");
          return prevLayers;
        }

        return {
          ...prevLayers,
          [layerId]: {
            ...layer,
            paint: {
              ...layer.paint,
              [paintProperty]: value,
            },
          },
        };
      });
    },
    []
  );

  const setLayerLayoutProperty = useCallback(
    (layerId: string, layoutProperty: string, value: unknown) => {
      setLayers((prevLayers) => {
        const layer = prevLayers[layerId];

        if (!layer) {
          console.error("Layer not found");
          return prevLayers;
        }

        return {
          ...prevLayers,
          [layerId]: {
            ...layer,
            layout: {
              ...layer.layout,
              [layoutProperty]: value,
            },
          },
        };
      });
    },
    []
  );

  useEffect(() => {
    if (dcMetroLines.data && dcMetroStations.data) {
      addSource("dc-metro-lines", {
        type: "geojson",
        data: dcMetroLines.data,
      });
      addSource("dc-metro-stations", {
        type: "geojson",
        data: dcMetroStations.data,
      });

      addLayer(
        getInitialLayerStyle("dc-metro-lines", "dc-metro-lines", "line")
      );
      addLayer(
        getInitialLayerStyle("dc-metro-stations", "dc-metro-stations", "circle")
      );
    }
  }, [dcMetroLines.data, dcMetroStations.data]);

  return (
    <MapEditorContext.Provider
      value={{
        layers,
        sources,
        setLayerSource,
        setLayerType,
        setLayerMinZoom,
        setLayerMaxZoom,
        setLayerFilter,
        setLayerPaintProperty,
        setLayerLayoutProperty,
      }}
    >
      {children}
    </MapEditorContext.Provider>
  );
};

export const useMapEditorContext = () => {
  return useContext(MapEditorContext);
};
