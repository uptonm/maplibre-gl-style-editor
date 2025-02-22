"use client";

import { GeoJSONSource, LngLatBounds, Map as MapGL } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { mapStore$ } from "~/contexts/MapStore";

import { use$ } from "@legendapp/state/react";
import { api } from "~/trpc/react";
import { enableReactUse } from "@legendapp/state/config/enableReactUse";
import { env } from "~/env";

enableReactUse();

export function MapViewer() {
  const mapGLRef = useRef<MapGL>();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapGLLoaded, setMapGLLoaded] = useState<boolean>(false);
  const [mapGLStyleLoaded, setMapGLStyleLoaded] = useState<boolean>(false);

  const isInitialized = use$(mapStore$.isInitialized);
  const sources = use$(mapStore$.sources);
  const layers = use$(mapStore$.layers);
  const layerOrder = use$(mapStore$.layerOrder);
  const bounds = use$(() => mapStore$.bounds.get());

  const dcMetroLines = api.source.getSource.useQuery({
    id: "lines",
  });
  const dcMetroStations = api.source.getSource.useQuery({
    id: "stations",
  });

  const hasInitializedSources = useRef(false);
  useEffect(() => {
    if (
      !dcMetroLines.data ||
      !dcMetroStations.data ||
      hasInitializedSources.current
    ) {
      return;
    }

    hasInitializedSources.current = true;
    mapStore$.__initialize(dcMetroLines.data, dcMetroStations.data);
  }, [dcMetroLines, dcMetroStations]);

  useEffect(() => {
    if (mapContainerRef.current === null) return;

    mapGLRef.current = new MapGL({
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${env.NEXT_PUBLIC_MAPTILER_API_KEY}`,
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
        const existingSource = mapGLRef.current!.getSource(sourceId);
        if (existingSource instanceof GeoJSONSource) {
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
    if (
      mapGLRef.current &&
      mapGLLoaded &&
      mapGLStyleLoaded &&
      bounds &&
      isInitialized
    ) {
      mapGLRef.current.fitBounds(
        new LngLatBounds([bounds[0], bounds[1]], [bounds[2], bounds[3]]),
        {
          padding: 50,
        },
      );
    }
  }, [bounds, mapGLLoaded, mapGLStyleLoaded, isInitialized]);

  return (
    <div
      ref={mapContainerRef}
      className="absolute left-0 top-0 h-full w-full"
    />
  );
}
