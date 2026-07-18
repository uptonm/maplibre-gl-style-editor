import {
  CopyIcon,
  GlobeIcon,
  MaximizeIcon,
  SquareDashedMousePointerIcon,
  XIcon,
} from "lucide-react";
import {
  type AddLayerObject,
  GeoJSONSource,
  LngLatBounds,
  Map as MapGL,
  NavigationControl,
} from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { resolveBasemapStyle } from "~/lib/basemaps";
import { cn } from "~/lib/cn";
import {
  coerceFeatureCollection,
  dataBounds,
  layerTypesForData,
  slugify,
} from "~/lib/geo";
import { uniqueId, useEditorStore } from "~/lib/store";
import { createLayer } from "~/lib/style-spec";

function fitToData(map: MapGL): void {
  const bounds = dataBounds(useEditorStore.getState().sources);
  if (!bounds) return;
  map.fitBounds(
    new LngLatBounds([bounds[0], bounds[1]], [bounds[2], bounds[3]]),
    { padding: 60, duration: 500 },
  );
}

function applyProjection(map: MapGL): void {
  // setProjection throws before the style finishes loading; the sync effect
  // re-applies once it has. Skipping the no-op case matters: setProjection
  // fires style events that would re-trigger the sync in a loop.
  if (!map.isStyleLoaded()) return;
  const desired = useEditorStore.getState().projection;
  if ((map.getProjection()?.type ?? "mercator") !== desired) {
    map.setProjection({ type: desired });
  }
}

type InspectedFeature = {
  layerId: string;
  geometry: string;
  properties: Record<string, unknown>;
};

function MapAction({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          aria-label={label}
          onClick={onClick}
          className={cn(
            "shadow",
            active && "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}

function InspectorCard({
  features,
  onClose,
}: {
  features: InspectedFeature[];
  onClose: () => void;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  return (
    <div className="absolute bottom-3 left-3 z-10 max-h-[55%] w-80 overflow-y-auto rounded-lg border bg-card/95 shadow-xl">
      <div className="sticky top-0 flex items-center justify-between border-b bg-card px-3 py-2">
        <p className="text-sm font-medium">
          {features.length} feature{features.length === 1 ? "" : "s"} here
        </p>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close inspector"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </div>
      {features.map((feature, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: results are positional per click
          key={index}
          className="border-b px-3 py-2 last:border-b-0"
        >
          <p className="pb-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {feature.layerId}
            </span>{" "}
            · {feature.geometry}
          </p>
          {Object.keys(feature.properties).length === 0 && (
            <p className="text-xs text-muted-foreground">No properties</p>
          )}
          {Object.entries(feature.properties).map(([key, value]) => (
            <button
              key={key}
              type="button"
              title={`Copy ["get", "${key}"]`}
              className="group flex w-full items-baseline justify-between gap-2 rounded px-1 py-0.5 text-left hover:bg-accent"
              onClick={() => {
                void navigator.clipboard.writeText(`["get", "${key}"]`);
                setCopiedKey(`${index}:${key}`);
                setTimeout(() => setCopiedKey(null), 1200);
              }}
            >
              <span className="flex items-center gap-1 truncate font-mono text-xs text-foreground">
                {key}
                <CopyIcon className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
              </span>
              <span className="truncate font-mono text-xs text-muted-foreground">
                {copiedKey === `${index}:${key}` ? "copied!" : String(value)}
              </span>
            </button>
          ))}
        </div>
      ))}
      <p className="px-3 py-2 text-[11px] text-muted-foreground">
        Click a property to copy its ["get", …] expression.
      </p>
    </div>
  );
}

function ZoomSimulator({ map }: { map: MapGL | null }) {
  const [zoom, setZoom] = useState(map?.getZoom() ?? 10);

  useEffect(() => {
    if (!map) return;
    const onMove = () => setZoom(map.getZoom());
    map.on("move", onMove);
    return () => {
      map.off("move", onMove);
    };
  }, [map]);

  return (
    <div className="absolute bottom-12 right-3 z-10 flex w-56 items-center gap-2.5 rounded-lg border bg-card/95 px-3 py-2 shadow-lg">
      <span className="shrink-0 font-mono text-xs text-muted-foreground">
        z{zoom.toFixed(1)}
      </span>
      <Slider
        min={0}
        max={24}
        step={0.1}
        value={[zoom]}
        onValueChange={([next]) => {
          if (next !== undefined) map?.zoomTo(next, { duration: 0 });
        }}
        aria-label="Zoom level"
      />
    </div>
  );
}

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapGL | null>(null);
  const appliedRef = useRef<{ sources: string[]; layers: string[] }>({
    sources: [],
    layers: [],
  });
  const inspectModeRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [styleGeneration, setStyleGeneration] = useState(0);
  const [layerErrors, setLayerErrors] = useState<string[]>([]);
  const [inspectMode, setInspectMode] = useState(false);
  const [inspected, setInspected] = useState<InspectedFeature[] | null>(null);
  const [isDropTarget, setIsDropTarget] = useState(false);

  const basemap = useEditorStore((state) => state.basemap);
  const maptilerKey = useEditorStore((state) => state.maptilerKey);
  const projection = useEditorStore((state) => state.projection);
  const setProjection = useEditorStore((state) => state.setProjection);
  const sources = useEditorStore((state) => state.sources);
  const layers = useEditorStore((state) => state.layers);
  const layerOrder = useEditorStore((state) => state.layerOrder);

  inspectModeRef.current = inspectMode;

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
    map.addControl(new NavigationControl({ visualizePitch: true }));

    // A style swap wipes user sources/layers and the projection, so every
    // finished style load must re-sync editor state onto the fresh style.
    map.on("style.load", () => {
      appliedRef.current = { sources: [], layers: [] };
      setStyleGeneration((generation) => generation + 1);
    });
    map.once("load", () => {
      fitToData(map);
      setMapReady(true);
    });
    map.on("click", (event) => {
      if (!inspectModeRef.current) return;
      const hitLayers = appliedRef.current.layers.filter((id) =>
        map.getLayer(id),
      );
      const features = map.queryRenderedFeatures(event.point, {
        layers: hitLayers,
      });
      setInspected(
        features.length === 0
          ? null
          : features.slice(0, 10).map((feature) => ({
              layerId: feature.layer.id,
              geometry: feature.geometry.type,
              properties: feature.properties ?? {},
            })),
      );
    });

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: projection is the trigger; applyProjection reads it from the store
  useEffect(() => {
    const map = mapRef.current;
    if (map) applyProjection(map);
  }, [projection]);

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

    applyProjection(map);

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
        map.addLayer(layer as unknown as AddLayerObject);
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

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDropTarget(false);
    const files = [...event.dataTransfer.files].filter((file) =>
      /\.(geo)?json$/i.test(file.name),
    );
    const store = useEditorStore.getState();
    for (const file of files) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        continue;
      }
      const collection = coerceFeatureCollection(parsed);
      if (!collection) continue;
      const sourceId = uniqueId(slugify(file.name), store.sources);
      store.addSource(sourceId, collection);
      for (const type of layerTypesForData(collection)) {
        store.addLayer(
          createLayer(
            uniqueId(`${sourceId}-${type}`, useEditorStore.getState().layers),
            sourceId,
            type,
          ),
        );
      }
    }
    if (files.length > 0 && mapRef.current) fitToData(mapRef.current);
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop target; file picking stays available in the Sources panel
    <div
      className={cn(
        "absolute inset-0",
        // The cursor override must live up here: MapLibre owns the container
        // div's class list after init, and React re-rendering a conditional
        // className there would wipe the maplibregl-* classes.
        inspectMode && "**:[.maplibregl-canvas]:cursor-crosshair!",
      )}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("Files")) {
          event.preventDefault();
          setIsDropTarget(true);
        }
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setIsDropTarget(false);
      }}
      onDrop={(event) => void handleDrop(event)}
    >
      <div ref={containerRef} className="size-full" />
      <div className="absolute right-2.5 top-28 z-10 flex flex-col gap-1.5">
        <MapAction
          label="Fit to data"
          onClick={() => mapRef.current && fitToData(mapRef.current)}
        >
          <MaximizeIcon />
        </MapAction>
        <MapAction
          label={
            projection === "globe" ? "Flat projection" : "Globe projection"
          }
          active={projection === "globe"}
          onClick={() =>
            setProjection(projection === "globe" ? "mercator" : "globe")
          }
        >
          <GlobeIcon />
        </MapAction>
        <MapAction
          label={inspectMode ? "Exit inspect mode" : "Inspect features"}
          active={inspectMode}
          onClick={() => {
            setInspectMode(!inspectMode);
            if (inspectMode) setInspected(null);
          }}
        >
          <SquareDashedMousePointerIcon />
        </MapAction>
      </div>
      {inspectMode && !inspected && (
        <div className="absolute bottom-3 left-3 z-10 rounded-md border bg-card/95 px-3 py-1.5 text-xs text-muted-foreground shadow">
          Click a feature to inspect its properties.
        </div>
      )}
      {inspected && (
        <InspectorCard
          features={inspected}
          onClose={() => setInspected(null)}
        />
      )}
      {mapReady && <ZoomSimulator map={mapRef.current} />}
      {isDropTarget && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center border-2 border-dashed border-primary bg-primary/10">
          <p className="rounded-md bg-card px-4 py-2 text-sm font-medium shadow-lg">
            Drop GeoJSON to add it to the map
          </p>
        </div>
      )}
      {layerErrors.length > 0 && (
        <div className="absolute bottom-14 left-1/2 z-10 max-w-xl -translate-x-1/2 rounded-md border border-destructive/50 bg-card/95 px-3 py-2 text-xs text-destructive shadow-lg">
          {layerErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}
    </div>
  );
}
