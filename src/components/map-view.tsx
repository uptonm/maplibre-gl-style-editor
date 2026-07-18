import { MaximizeIcon } from "lucide-react";
import { GeoJSONSource, LngLatBounds, Map as MapGL } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { resolveBasemapStyle } from "~/lib/basemaps";
import { dataBounds } from "~/lib/geo";
import { useEditorStore } from "~/lib/store";

function fitToData(map: MapGL): void {
  const bounds = dataBounds(useEditorStore.getState().sources);
  if (!bounds) return;
  map.fitBounds(
    new LngLatBounds([bounds[0], bounds[1]], [bounds[2], bounds[3]]),
    { padding: 60, duration: 500 },
  );
}

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapGL | null>(null);
  const appliedRef = useRef<{ sources: string[]; layers: string[] }>({
    sources: [],
    layers: [],
  });
  const [styleGeneration, setStyleGeneration] = useState(0);
  const [layerErrors, setLayerErrors] = useState<string[]>([]);

  const basemap = useEditorStore((state) => state.basemap);
  const maptilerKey = useEditorStore((state) => state.maptilerKey);
  const sources = useEditorStore((state) => state.sources);
  const layers = useEditorStore((state) => state.layers);
  const layerOrder = useEditorStore((state) => state.layerOrder);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new MapGL({
      container: containerRef.current,
      style: resolveBasemapStyle(
        useEditorStore.getState().basemap,
        useEditorStore.getState().maptilerKey,
      ),
      center: [-77.03, 38.9],
      zoom: 10,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    // Console access for debugging styles by hand.
    (window as unknown as { __map?: MapGL }).__map = map;

    // A style swap wipes user sources/layers, so every finished style load
    // must trigger a re-sync of editor state onto the fresh style.
    map.on("style.load", () => {
      appliedRef.current = { sources: [], layers: [] };
      setStyleGeneration((generation) => generation + 1);
    });
    map.once("load", () => fitToData(map));

    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(resolveBasemapStyle(basemap, maptilerKey));
  }, [basemap, maptilerKey]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: styleGeneration re-runs the sync after a basemap swap wipes user layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.isStyleLoaded()) {
      // isStyleLoaded() can lag the style.load event; retry once the map
      // settles instead of dropping this sync.
      map.once("idle", () => setStyleGeneration((g) => g + 1));
      return;
    }

    const applied = appliedRef.current;
    const errors: string[] = [];

    for (const layerId of applied.layers) {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    }
    for (const sourceId of applied.sources) {
      if (!(sourceId in sources) && map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    }

    for (const [sourceId, source] of Object.entries(sources)) {
      const existing = map.getSource(sourceId);
      if (existing instanceof GeoJSONSource) {
        existing.setData(source.data);
      } else {
        map.addSource(sourceId, source);
      }
    }

    const addedLayers: string[] = [];
    for (const layerId of layerOrder) {
      const layer = layers[layerId];
      if (!layer || !(layer.source in sources)) continue;
      try {
        map.addLayer(layer);
        addedLayers.push(layerId);
      } catch (error) {
        errors.push(
          `${layerId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    appliedRef.current = {
      sources: Object.keys(sources),
      layers: addedLayers,
    };
    setLayerErrors(errors);
  }, [sources, layers, layerOrder, styleGeneration]);

  return (
    <>
      <div ref={containerRef} className="size-full" />
      <div className="absolute right-3 top-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Fit to data"
              onClick={() => mapRef.current && fitToData(mapRef.current)}
            >
              <MaximizeIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Fit to data</TooltipContent>
        </Tooltip>
      </div>
      {layerErrors.length > 0 && (
        <div className="absolute bottom-3 left-1/2 z-10 max-w-xl -translate-x-1/2 rounded-md border border-destructive/50 bg-card/95 px-3 py-2 text-xs text-destructive shadow-lg">
          {layerErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}
    </>
  );
}
