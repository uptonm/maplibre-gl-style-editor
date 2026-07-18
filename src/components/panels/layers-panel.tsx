import {
  BoxIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleDotIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  FlameIcon,
  PlusIcon,
  SplineIcon,
  SquareIcon,
  Trash2Icon,
  TypeIcon,
} from "lucide-react";
import { useState } from "react";
import { LayerEditor } from "~/components/panels/layer-editor";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/cn";
import { uniqueId, useEditorStore } from "~/lib/store";
import type { EditorLayer, SupportedLayerType } from "~/lib/style-spec";
import { createLayer, SUPPORTED_LAYER_TYPES } from "~/lib/style-spec";

const TYPE_ICONS: Record<SupportedLayerType, typeof SplineIcon> = {
  line: SplineIcon,
  fill: SquareIcon,
  circle: CircleDotIcon,
  symbol: TypeIcon,
  heatmap: FlameIcon,
  "fill-extrusion": BoxIcon,
};

const SWATCH_PROPERTY: Record<SupportedLayerType, string> = {
  line: "line-color",
  fill: "fill-color",
  circle: "circle-color",
  symbol: "text-color",
  heatmap: "heatmap-color",
  "fill-extrusion": "fill-extrusion-color",
};

function layerColor(layer: EditorLayer): string | undefined {
  const paint = (layer.paint ?? {}) as Record<string, unknown>;
  const color = paint[SWATCH_PROPERTY[layer.type]];
  return typeof color === "string" ? color : undefined;
}

function SmallAction({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className={className}
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function LayerCard({
  layer,
  isOpen,
  onToggle,
}: {
  layer: EditorLayer;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const moveLayer = useEditorStore((state) => state.moveLayer);
  const removeLayer = useEditorStore((state) => state.removeLayer);
  const duplicateLayer = useEditorStore((state) => state.duplicateLayer);
  const toggleVisibility = useEditorStore((state) => state.toggleVisibility);

  const hidden = layer.layout?.visibility === "none";
  const TypeIconComponent = TYPE_ICONS[layer.type];
  const swatch = layerColor(layer);

  return (
    <div
      className={cn(
        "rounded-lg border bg-card transition-colors",
        isOpen && "border-primary/40",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
        className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left"
      >
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-md border"
          style={swatch ? { color: swatch } : undefined}
        >
          <TypeIconComponent className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-medium",
              hidden && "opacity-50",
            )}
          >
            {layer.id}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {layer.type} · {layer.source}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <SmallAction
            label={hidden ? "Show layer" : "Hide layer"}
            onClick={() => toggleVisibility(layer.id)}
          >
            {hidden ? <EyeOffIcon /> : <EyeIcon />}
          </SmallAction>
          <SmallAction
            label="Bring forward"
            onClick={() => moveLayer(layer.id, 1)}
          >
            <ChevronUpIcon />
          </SmallAction>
          <SmallAction
            label="Send backward"
            onClick={() => moveLayer(layer.id, -1)}
          >
            <ChevronDownIcon />
          </SmallAction>
          <SmallAction
            label="Duplicate layer"
            onClick={() => duplicateLayer(layer.id)}
          >
            <CopyIcon />
          </SmallAction>
          <SmallAction
            label="Delete layer"
            className="hover:text-destructive"
            onClick={() => removeLayer(layer.id)}
          >
            <Trash2Icon />
          </SmallAction>
        </div>
      </div>
      {isOpen && (
        <div className="border-t px-3 pb-3 pt-2">
          <LayerEditor layer={layer} />
        </div>
      )}
    </div>
  );
}

export function LayersPanel() {
  const layers = useEditorStore((state) => state.layers);
  const layerOrder = useEditorStore((state) => state.layerOrder);
  const sources = useEditorStore((state) => state.sources);
  const addLayer = useEditorStore((state) => state.addLayer);
  const [openLayerId, setOpenLayerId] = useState<string | null>(null);

  const sourceIds = Object.keys(sources);
  // Topmost-rendered layer first, like every other layers panel.
  const displayOrder = [...layerOrder].reverse();

  const handleAdd = (type: SupportedLayerType) => {
    const firstSource = sourceIds[0];
    if (!firstSource) return;
    const id = uniqueId(`${type}-layer`, layers);
    addLayer(createLayer(id, firstSource, type));
    setOpenLayerId(id);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
        {displayOrder.length === 0 && (
          <p className="px-1 py-6 text-center text-sm text-muted-foreground">
            No layers yet. Add one below.
          </p>
        )}
        {displayOrder.map((layerId) => {
          const layer = layers[layerId];
          if (!layer) return null;
          return (
            <LayerCard
              key={layerId}
              layer={layer}
              isOpen={openLayerId === layerId}
              onToggle={() =>
                setOpenLayerId(openLayerId === layerId ? null : layerId)
              }
            />
          );
        })}
      </div>
      <div className="border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full" disabled={sourceIds.length === 0}>
              <PlusIcon />
              Add layer
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="center">
            {SUPPORTED_LAYER_TYPES.map((type) => {
              const TypeIconComponent = TYPE_ICONS[type];
              return (
                <DropdownMenuItem key={type} onSelect={() => handleAdd(type)}>
                  <TypeIconComponent />
                  {type}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        {sourceIds.length === 0 && (
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Add a source first.
          </p>
        )}
      </div>
    </div>
  );
}
