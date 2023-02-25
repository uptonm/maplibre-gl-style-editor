import { useMapEditorContext } from "../context/MapEditorContext";
import { SupportedLayerTypes } from "../lib/constants";
import type {
  SupportedLayerSpecification,
  SupportedLayerType,
} from "../lib/types";
import {
  getInitialLayerStyle,
  getLayerLayoutProperties,
  getLayerLayoutPropertyValue,
  getLayerPaintProperties,
  getLayerPaintPropertyValue,
} from "../lib/utils";
import { DynamicInput } from "./inputs/DynamicInput";
import { SelectInput } from "./inputs/SelectInput";
import { SliderInput } from "./inputs/SliderInput";
import { TextInput } from "./inputs/TextInput";
import "react-tooltip/dist/react-tooltip.css";
import { useCallback, useEffect, useState } from "react";
import { FilterSpecification } from "maplibre-gl";
import { DebouncedTextInput } from "./inputs/DebouncedTextInput";

export const LayersPanel = () => {
  const { layers, sources, layerOrder, addLayer } = useMapEditorContext();

  const [editingLayerIndex, setEditingLayerIndex] = useState<number | null>(
    null
  );

  return (
    <div className="w-lg h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Layers</h2>
        <button
          type="button"
          data-tooltip-id="action-icon-tooltip"
          data-tooltip-content="Add Layer"
          className="ml-2 inline-flex items-center rounded-full border border-slate-500 p-1 text-slate-500 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-300"
          onClick={() =>
            addLayer(
              getInitialLayerStyle(
                `layer-${layerOrder.length}`,
                Object.keys(sources)[0]!,
                "line"
              )
            )
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3 w-3"
          >
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>

          <span className="sr-only">Add Layer</span>
        </button>
      </div>
      <div className="space-y-4 pt-2">
        {layerOrder.map((layerId, layerIndex) => (
          <LayerEditor
            key={layerIndex}
            layerId={layerId}
            layer={layers[layerId]!}
            isEditing={layerIndex === editingLayerIndex}
            setIsEditing={(isEditing: boolean) =>
              setEditingLayerIndex(isEditing ? layerIndex : null)
            }
          />
        ))}
      </div>
    </div>
  );
};

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
  const { sources, updateLayer, moveLayerUp, moveLayerDown } =
    useMapEditorContext();

  const [currentLayerSpecification, setCurrentLayerSpecification] =
    useState<SupportedLayerSpecification>(layer);

  const setLayerId = useCallback((id: string) => {
    console.log("setLayerId", id);
    setCurrentLayerSpecification((prevLayer) => ({
      ...prevLayer,
      id,
    }));
  }, []);

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
        layerType
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
    []
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
    []
  );

  useEffect(() => {
    if (layer !== currentLayerSpecification) {
      updateLayer(layerId, currentLayerSpecification);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLayerSpecification, updateLayer]);

  if (isEditing) {
    return (
      <div key={layerId} className="flex flex-col space-y-1">
        <div className="flex items-center">
          <DebouncedTextInput
            onChange={setLayerId}
            value={currentLayerSpecification.id}
          />
          <button
            type="button"
            data-tooltip-id="action-icon-tooltip"
            data-tooltip-content="Stop Editing"
            onClick={() => setIsEditing(false)}
            className="ml-2 inline-flex items-center rounded-full border border-slate-500 p-1 text-slate-500 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3 w-3"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>

            <span className="sr-only">Stop Editing</span>
          </button>
        </div>
        <div className="flex flex-col space-y-1 pl-4">
          <label htmlFor="layout" className="font-semibold">
            Metadata
          </label>
          <div className="flex flex-col space-y-1 pl-4">
            <SelectInput
              value={layer.source}
              label="Source"
              options={Object.keys(sources)}
              onChange={(value) => setLayerSource(value)}
            />

            <SelectInput
              value={layer.type}
              label="Type"
              options={SupportedLayerTypes}
              onChange={(value) => setLayerType(value as SupportedLayerType)}
            />

            <SliderInput
              value={layer.minzoom ?? 0}
              label={`Min Zoom (${layer.minzoom ?? 0})`}
              max={24}
              onChange={(value) => setLayerMinZoom(value)}
            />

            <SliderInput
              value={layer.maxzoom ?? 24}
              label={`Max Zoom (${layer.maxzoom ?? 24})`}
              max={24}
              onChange={(value) => setLayerMaxZoom(value)}
            />

            <TextInput
              value={JSON.stringify(layer.filter)}
              label="Filter"
              onChange={(value) => setLayerFilter(value)}
            />
          </div>

          <label htmlFor="paint" className="font-semibold">
            Paint Properties
          </label>
          <div id="paint" className="flex flex-col space-y-1 pl-4">
            {getLayerPaintProperties(layer.type).map((paintKey) => {
              const propertyValue = getLayerPaintPropertyValue(
                layer.type,
                paintKey
              );
              const currentValue =
                layer.paint?.[paintKey as keyof typeof layer.paint] ??
                propertyValue!.default;
              return (
                <DynamicInput
                  currentValue={currentValue}
                  propertyValue={propertyValue!}
                  key={`${layerId}:paint_property:${paintKey}`}
                  label={`${paintKey} (${currentValue.toString()})`}
                  onChange={(value) => setLayerPaintProperty(paintKey, value)}
                />
              );
            })}
          </div>

          <label htmlFor="layout" className="font-semibold">
            Layout Properties
          </label>
          <div id="layout" className="flex flex-col space-y-1 pl-4">
            {getLayerLayoutProperties(layer.type).map((layoutKey) => {
              const propertyValue = getLayerLayoutPropertyValue(
                layer.type,
                layoutKey
              );
              const currentValue =
                layer.layout?.[layoutKey as keyof typeof layer.layout] ??
                propertyValue!.default;
              return (
                <DynamicInput
                  currentValue={currentValue}
                  propertyValue={propertyValue!}
                  key={`${layerId}:layout_property:${layoutKey}`}
                  label={`${layoutKey} (${currentValue.toString()})`}
                  onChange={(value) => setLayerLayoutProperty(layoutKey, value)}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={layerId} className="flex flex-col space-y-1">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold">{layerId}</h4>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            data-tooltip-id="action-icon-tooltip"
            data-tooltip-content="Move Layer Up"
            className="ml-2 inline-flex items-center rounded-full border border-slate-500 p-1 text-slate-500 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-300"
            onClick={() => moveLayerUp(layerId)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3 w-3"
            >
              <path
                fillRule="evenodd"
                d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
                clipRule="evenodd"
              />
            </svg>

            <span className="sr-only">Move Layer Up</span>
          </button>
          <button
            type="button"
            data-tooltip-id="action-icon-tooltip"
            data-tooltip-content="Move Layer Down"
            className="ml-2 inline-flex items-center rounded-full border border-slate-500 p-1 text-slate-500 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-300"
            onClick={() => moveLayerDown(layerId)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3 w-3"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>

            <span className="sr-only">Move Layer Down</span>
          </button>
          <button
            type="button"
            data-tooltip-id="action-icon-tooltip"
            data-tooltip-content="Edit"
            onClick={() => setIsEditing(true)}
            className="ml-2 inline-flex items-center rounded-full border border-slate-500 p-1 text-slate-500 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3 w-3"
            >
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
            <span className="sr-only">Edit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
