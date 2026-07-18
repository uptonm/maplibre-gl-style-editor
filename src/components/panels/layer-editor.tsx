import { useState } from "react";
import { JsonEditor } from "~/components/json-editor";
import { PropertyInput } from "~/components/property-input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { useEditorStore } from "~/lib/store";
import type { EditorLayer, SupportedLayerType } from "~/lib/style-spec";
import {
  createLayer,
  layoutProperties,
  paintProperties,
  SUPPORTED_LAYER_TYPES,
} from "~/lib/style-spec";

function LayerIdInput({ layer }: { layer: EditorLayer }) {
  const renameLayer = useEditorStore((state) => state.renameLayer);
  const [draft, setDraft] = useState(layer.id);
  const [rejected, setRejected] = useState(false);

  const commit = () => {
    if (draft === layer.id) return;
    const renamed = renameLayer(layer.id, draft.trim());
    setRejected(!renamed);
    if (!renamed) setDraft(layer.id);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`${layer.id}-id`}>ID</Label>
      <Input
        id={`${layer.id}-id`}
        value={draft}
        spellCheck={false}
        onChange={(event) => {
          setDraft(event.target.value);
          setRejected(false);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
      {rejected && (
        <p className="text-xs text-destructive">
          That ID is empty or already taken.
        </p>
      )}
    </div>
  );
}

function ZoomRange({ layer }: { layer: EditorLayer }) {
  const updateLayer = useEditorStore((state) => state.updateLayer);
  const minzoom = layer.minzoom ?? 0;
  const maxzoom = layer.maxzoom ?? 24;

  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        Zoom range ({minzoom} – {maxzoom})
      </Label>
      <Slider
        min={0}
        max={24}
        step={1}
        value={[minzoom, maxzoom]}
        onValueChange={([min, max]) => {
          if (min === undefined || max === undefined) return;
          updateLayer(layer.id, {
            minzoom: min === 0 ? undefined : min,
            maxzoom: max === 24 ? undefined : max,
          });
        }}
      />
    </div>
  );
}

function PropertyGroup({
  layer,
  group,
}: {
  layer: EditorLayer;
  group: "paint" | "layout";
}) {
  const setPaintProperty = useEditorStore((state) => state.setPaintProperty);
  const setLayoutProperty = useEditorStore((state) => state.setLayoutProperty);
  const descriptors =
    group === "paint"
      ? paintProperties(layer.type)
      : layoutProperties(layer.type);
  const current = (layer[group] ?? {}) as Record<string, unknown>;
  const setter = group === "paint" ? setPaintProperty : setLayoutProperty;

  return (
    <div className="flex flex-col gap-3.5">
      {Object.entries(descriptors).map(([name, descriptor]) => (
        <PropertyInput
          key={`${layer.id}:${name}`}
          name={name}
          descriptor={descriptor}
          value={current[name]}
          onChange={(value) => setter(layer.id, name, value)}
        />
      ))}
    </div>
  );
}

export function LayerEditor({ layer }: { layer: EditorLayer }) {
  const sources = useEditorStore((state) => state.sources);
  const updateLayer = useEditorStore((state) => state.updateLayer);
  const addLayer = useEditorStore((state) => state.addLayer);
  const removeLayer = useEditorStore((state) => state.removeLayer);

  const changeType = (type: SupportedLayerType) => {
    // Paint/layout properties don't transfer between types, so swap in a
    // starter layer instead of carrying stale keys over.
    const replacement = createLayer(layer.id, layer.source, type);
    removeLayer(layer.id);
    addLayer(replacement);
  };

  return (
    <div className="flex flex-col gap-3 px-1 pt-1">
      <LayerIdInput layer={layer} />

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label>Source</Label>
          <Select
            value={layer.source}
            onValueChange={(source) => updateLayer(layer.id, { source })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(sources).map((id) => (
                <SelectItem key={id} value={id}>
                  {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Type</Label>
          <Select
            value={layer.type}
            onValueChange={(type) => changeType(type as SupportedLayerType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LAYER_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ZoomRange layer={layer} />

      <div className="flex flex-col gap-1.5">
        <Label>Filter</Label>
        <JsonEditor
          value={layer.filter}
          rows={2}
          placeholder='e.g. ["==", ["get", "LINE"], "red"]'
          onChange={(filter) =>
            updateLayer(layer.id, { filter: filter as EditorLayer["filter"] })
          }
        />
      </div>

      <Accordion type="multiple" defaultValue={["paint"]}>
        <AccordionItem value="paint">
          <AccordionTrigger>Paint</AccordionTrigger>
          <AccordionContent>
            <PropertyGroup layer={layer} group="paint" />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="layout">
          <AccordionTrigger>Layout</AccordionTrigger>
          <AccordionContent>
            <PropertyGroup layer={layer} group="layout" />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
