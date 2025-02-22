"use client";

import { use$ } from "@legendapp/state/react";
import { Accordion } from "@radix-ui/react-accordion";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react";
import { type FilterSpecification } from "maplibre-gl";
import { useCallback, useEffect, useState } from "react";
import { DynamicInput } from "~/components/inputs/DynamicInput";
import { SelectInput } from "~/components/inputs/SelectInput";
import { SliderInput } from "~/components/inputs/SliderInput";
import { TextInput } from "~/components/inputs/TextInput";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { H3 } from "~/components/ui/typography";
import { mapStore$ } from "~/contexts/MapStore";
import { SupportedLayerTypes } from "~/lib/map-constants";
import type {
  SupportedLayerSpecification,
  SupportedLayerType,
} from "~/lib/map-types";
import {
  getInitialLayerStyle,
  getLayerLayoutProperties,
  getLayerLayoutPropertyValue,
  getLayerPaintProperties,
  getLayerPaintPropertyValue,
} from "~/lib/map-utils";
import { Button } from "~/components/ui/button";
import { enableReactUse } from "@legendapp/state/config/enableReactUse";

enableReactUse();

export function LayersPanel() {
  const layers = use$(mapStore$.layers);
  const sources = use$(mapStore$.sources);
  const layerOrder = use$(mapStore$.layerOrder);

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);

  const handleAddLayer = () => {
    mapStore$.addLayer(
      getInitialLayerStyle(
        `layer-${layerOrder.length}`,
        Object.keys(sources)[0]!,
        "line",
      ),
    );
  };

  return (
    <div className="flex h-full flex-col space-y-2">
      <div className="flex flex-grow flex-col space-y-4 overflow-y-auto p-4">
        {layerOrder.map((layerId) => (
          <LayerEditor
            key={layerId}
            layerId={layerId}
            layer={layers[layerId]!}
            isEditing={layerId === editingLayerId}
            setIsEditing={(isEditing: boolean) =>
              setEditingLayerId(isEditing ? layerId : null)
            }
          />
        ))}
      </div>
      <div className="flex items-center space-x-2 border-t p-4">
        <Button
          variant="destructive"
          onClick={mapStore$.resetLayers}
          className="w-1/2"
        >
          <RefreshCwIcon className="size-4" />
          Reset All
        </Button>
        <Button variant="default" onClick={handleAddLayer} className="w-1/2">
          <PlusIcon className="size-4" />
          Add Layer
        </Button>
      </div>
    </div>
  );
}

type LayerEditorProps = {
  layerId: string;
  layer: SupportedLayerSpecification;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
};

const LayerEditor = ({
  layerId,
  layer,
  isEditing,
  setIsEditing,
}: LayerEditorProps) => {
  const sources = use$(mapStore$.sources);

  const [currentLayerSpecification, setCurrentLayerSpecification] =
    useState<SupportedLayerSpecification>(layer);

  const setLayerSource = useCallback((sourceId: string) => {
    setCurrentLayerSpecification((prevLayer) => ({
      ...prevLayer,
      source: sourceId,
    }));
  }, []);

  const setLayerType = useCallback((layerType: SupportedLayerType) => {
    setCurrentLayerSpecification((prevLayer) => {
      const initialStyleForLayer = getInitialLayerStyle(
        prevLayer.id,
        prevLayer.source,
        layerType,
      );

      return {
        ...initialStyleForLayer,
        id: prevLayer.id,
        source: prevLayer.source,
      };
    });
  }, []);

  const setLayerMinZoom = useCallback((zoom: number) => {
    setCurrentLayerSpecification((prevLayer) => ({
      ...prevLayer,
      minzoom: zoom,
    }));
  }, []);

  const setLayerMaxZoom = useCallback((zoom: number) => {
    setCurrentLayerSpecification((prevLayer) => ({
      ...prevLayer,
      maxzoom: zoom,
    }));
  }, []);

  const setLayerFilter = useCallback((filter: string) => {
    setCurrentLayerSpecification((prevLayer) => {
      let parsedFilter: FilterSpecification;
      try {
        parsedFilter = JSON.parse(filter) as FilterSpecification;
      } catch (err) {
        console.error("Invalid filter");
        return prevLayer;
      }

      return {
        ...prevLayer,
        filter: parsedFilter,
      };
    });
  }, []);

  const setLayerPaintProperty = useCallback(
    (paintProperty: string, value: unknown) => {
      setCurrentLayerSpecification((prevLayer) => ({
        ...prevLayer,
        paint: {
          ...prevLayer.paint,
          [paintProperty]: value,
        },
      }));
    },
    [],
  );

  const setLayerLayoutProperty = useCallback(
    (layoutProperty: string, value: unknown) => {
      setCurrentLayerSpecification((prevLayer) => ({
        ...prevLayer,
        layout: {
          ...prevLayer.layout,
          [layoutProperty]: value,
        },
      }));
    },
    [],
  );

  useEffect(() => {
    if (layer !== currentLayerSpecification) {
      mapStore$.updateLayer(layerId, currentLayerSpecification);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLayerSpecification]);

  if (isEditing) {
    return (
      <div key={layerId} className="flex flex-col space-y-1">
        <div className="flex items-center justify-between">
          <H3>{layerId}</H3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setIsEditing(false)}
              >
                <XIcon className="size-4" />
                <span className="sr-only">Stop Editing</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent alignOffset={10}>Stop Editing</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex flex-col pl-2">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="metadata">
              <AccordionTrigger>Metadata</AccordionTrigger>
              <AccordionContent className="flex flex-col space-y-4 px-2 py-2">
                <SelectInput
                  id={`${layerId}:source`}
                  value={layer.source}
                  label="Source"
                  options={Object.keys(sources)}
                  onChange={(value) => setLayerSource(value)}
                />

                <SelectInput
                  id={`${layerId}:type`}
                  value={layer.type}
                  label="Type"
                  options={SupportedLayerTypes}
                  onChange={(value) =>
                    setLayerType(value as SupportedLayerType)
                  }
                />

                <SliderInput
                  id={`${layerId}:minzoom`}
                  value={layer.minzoom ?? 0}
                  label={`Min Zoom (${layer.minzoom ?? 0})`}
                  max={24}
                  onChange={(value) => setLayerMinZoom(value)}
                />

                <SliderInput
                  id={`${layerId}:maxzoom`}
                  value={layer.maxzoom ?? 24}
                  label={`Max Zoom (${layer.maxzoom ?? 24})`}
                  max={24}
                  onChange={(value) => setLayerMaxZoom(value)}
                />

                <TextInput
                  id={`${layerId}:filter`}
                  value={JSON.stringify(layer.filter)}
                  label="Filter"
                  onChange={(value) => setLayerFilter(value)}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="paint">
              <AccordionTrigger>Paint Properties</AccordionTrigger>
              <AccordionContent className="flex flex-col space-y-4 px-2 py-2">
                {getLayerPaintProperties(layer.type).map((paintKey) => {
                  const propertyKey = `${layerId}:paint_property:${paintKey}`;
                  const propertyValue = getLayerPaintPropertyValue(
                    layer.type,
                    paintKey,
                  );
                  const currentValue =
                    layer.paint?.[paintKey as keyof typeof layer.paint] ??
                    propertyValue!.default;
                  return (
                    <DynamicInput
                      key={propertyKey}
                      id={propertyKey}
                      currentValue={currentValue}
                      propertyValue={propertyValue!}
                      label={`${paintKey} (${currentValue.toString()})`}
                      onChange={(value) =>
                        setLayerPaintProperty(paintKey, value)
                      }
                    />
                  );
                })}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="layout">
              <AccordionTrigger>Layout Properties</AccordionTrigger>
              <AccordionContent className="flex flex-col space-y-4 px-2 py-2">
                {getLayerLayoutProperties(layer.type).map((layoutKey) => {
                  const propertyKey = `${layerId}:layout_property:${layoutKey}`;
                  const propertyValue = getLayerLayoutPropertyValue(
                    layer.type,
                    layoutKey,
                  );
                  const currentValue =
                    layer.layout?.[layoutKey as keyof typeof layer.layout] ??
                    propertyValue!.default;
                  return (
                    <DynamicInput
                      key={propertyKey}
                      id={propertyKey}
                      currentValue={currentValue}
                      propertyValue={propertyValue!}
                      label={`${layoutKey} (${currentValue.toString()})`}
                      onChange={(value) =>
                        setLayerLayoutProperty(layoutKey, value)
                      }
                    />
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    );
  }

  return (
    <div key={layerId} className="flex items-center justify-between">
      <H3>{layerId}</H3>
      <div className="flex items-center space-x-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => mapStore$.moveLayerUp(layerId)}
            >
              <ArrowUpIcon className="size-4" />
              <span className="sr-only">Move Layer Up</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent alignOffset={10}>Move Layer Up</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => mapStore$.moveLayerDown(layerId)}
            >
              <ArrowDownIcon className="size-4" />
              <span className="sr-only">Move Layer Down</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent alignOffset={10}>Move Layer Down</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => setIsEditing(true)}
            >
              <PencilIcon className="size-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent alignOffset={10}>Edit</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
