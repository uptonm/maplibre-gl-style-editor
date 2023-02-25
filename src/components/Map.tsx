import { GeoJSONSource, Map as MapGL } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";

import { useMapEditorContext } from "../context/MapEditorContext";
import { calculateExtentsOfFeatures } from "../lib/utils";

export const Map = () => {
  const mapGLRef = useRef<MapGL>();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapGLLoaded, setMapGLLoaded] = useState<boolean>(false);
  const [mapGLStyleLoaded, setMapGLStyleLoaded] = useState<boolean>(false);

  const { layers, layerOrder, sources } = useMapEditorContext();

  const extents = useMemo(() => {
    const features: GeoJSON.Feature[] = [];
    Object.values(sources).forEach((source) => {
      if (source.data) {
        features.push(...(source.data as GeoJSON.FeatureCollection).features);
      }
    });
    return calculateExtentsOfFeatures(features);
  }, [sources]);

  useEffect(() => {
    if (mapContainerRef.current === null) return;

    mapGLRef.current = new MapGL({
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${
        process.env.NEXT_PUBLIC_MAPTILER_API_KEY as string
      }`,
      container: mapContainerRef.current,
      center: [-74.5, 40], // starting position [lng, lat]
      zoom: 9, // starting zoom
    });

    mapGLRef.current.on("load", () => setMapGLLoaded(true));
    mapGLRef.current.on("styledataloading", () => setMapGLStyleLoaded(false));
    mapGLRef.current.on("styledata", () => setMapGLStyleLoaded(true));

    return () => {
      mapGLRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (mapGLRef.current && mapGLLoaded && mapGLStyleLoaded) {
      Object.entries(sources).forEach(([sourceId, source]) => {
        const existingSource = mapGLRef.current!.getSource(sourceId) as
          | GeoJSONSource
          | undefined;
        if (existingSource) {
          existingSource.setData(source.data as GeoJSON.FeatureCollection);
        } else {
          mapGLRef.current!.addSource(sourceId, source);
        }
      });
      layerOrder.forEach((layerId) => {
        const layer = layers[layerId]!;
        const existingLayer = mapGLRef.current!.getLayer(layerId);
        if (existingLayer) {
          mapGLRef.current!.removeLayer(layerId);
        }
        mapGLRef.current!.addLayer(layer);
      });
    }
  }, [sources, layers, mapGLLoaded, mapGLStyleLoaded, layerOrder]);

  useEffect(() => {
    if (mapGLRef.current && mapGLLoaded && mapGLStyleLoaded && extents) {
      mapGLRef.current.fitBounds(extents, {
        padding: 50,
      });
    }
  }, [extents, mapGLLoaded, mapGLStyleLoaded]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
};
