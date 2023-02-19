import { useMapEditorContext } from "../context/MapEditorContext";
import { SupportedLayerTypes } from "../lib/constants";
import type { SupportedLayerType } from "../lib/types";
import {
  getLayerLayoutProperties,
  getLayerLayoutPropertyValue,
  getLayerPaintProperties,
  getLayerPaintPropertyValue,
} from "../lib/utils";
import { CheckboxInput } from "./inputs/CheckboxInput";
import { ColorInput } from "./inputs/ColorInput";
import { SelectInput } from "./inputs/SelectInput";
import { SliderInput } from "./inputs/SliderInput";
import { TextInput } from "./inputs/TextInput";
import { TupleInput } from "./inputs/TupleInput";

export const LayerStyleEditor = () => {
  const {
    layers,
    sources,
    setLayerSource,
    setLayerType,
    setLayerFilter,
    setLayerPaintProperty,
    setLayerLayoutProperty,
    setLayerMinZoom,
    setLayerMaxZoom,
  } = useMapEditorContext();

  return (
    <div className="w-lg h-full overflow-scroll px-4 py-2">
      <h2 className="text-xl font-bold">Layers</h2>
      <ul className="space-y-4 pt-2">
        {Object.entries(layers).map(([layerId, layer]) => (
          <li key={layerId} className="flex flex-col space-y-4">
            <h4 className="text-md font-semibold">{layerId}</h4>

            <SelectInput
              value={layer.source}
              label="Source"
              options={Object.keys(sources)}
              onChange={(value) => setLayerSource(layerId, value)}
            />

            <SelectInput
              value={layer.type}
              label="Type"
              options={SupportedLayerTypes}
              onChange={(value) =>
                setLayerType(layerId, value as SupportedLayerType)
              }
            />

            <SliderInput
              value={layer.minzoom ?? 0}
              label={`Min Zoom (${layer.minzoom ?? 0})`}
              max={24}
              onChange={(value) => setLayerMinZoom(layerId, value)}
            />

            <SliderInput
              value={layer.maxzoom ?? 24}
              label={`Max Zoom (${layer.maxzoom ?? 24})`}
              max={24}
              onChange={(value) => setLayerMaxZoom(layerId, value)}
            />

            <TextInput
              value={JSON.stringify(layer.filter)}
              label="Filter"
              onChange={(value) => setLayerFilter(layerId, value)}
            />

            <label htmlFor="paint" className="font-semibold">
              Paint Properties
            </label>
            <div id="paint" className="flex flex-col space-y-1">
              {getLayerPaintProperties(layer.type).map((paintKey) => {
                const value = getLayerPaintPropertyValue(layer.type, paintKey);
                if (value) {
                  switch (value.type) {
                    case "string": {
                      const currentValue =
                        layer.paint?.[paintKey as keyof typeof layer.paint] ??
                        value.default;
                      return (
                        <TextInput
                          value={currentValue}
                          label={`${paintKey} (${currentValue})`}
                          onChange={(value) =>
                            setLayerPaintProperty(layerId, paintKey, value)
                          }
                        />
                      );
                    }
                    case "enum": {
                      const currentValue =
                        layer.paint?.[paintKey as keyof typeof layer.paint] ??
                        value.default;
                      return (
                        <SelectInput
                          value={currentValue}
                          label={`${paintKey} (${currentValue})`}
                          options={value.values}
                          onChange={(value) =>
                            setLayerPaintProperty(layerId, paintKey, value)
                          }
                        />
                      );
                    }
                    case "number": {
                      const currentValue =
                        layer.paint?.[paintKey as keyof typeof layer.paint] ??
                        value.default;
                      return (
                        <SliderInput
                          value={currentValue}
                          label={`${paintKey} (${currentValue})`}
                          min={value.min}
                          max={value.max}
                          step={value.step}
                          onChange={(value) =>
                            setLayerPaintProperty(layerId, paintKey, value)
                          }
                        />
                      );
                    }
                    case "color": {
                      const currentValue =
                        layer.paint?.[paintKey as keyof typeof layer.paint] ??
                        value.default;
                      return (
                        <ColorInput
                          value={currentValue}
                          label={`${paintKey} (${currentValue})`}
                          onChange={(value) =>
                            setLayerPaintProperty(layerId, paintKey, value)
                          }
                        />
                      );
                    }
                    case "boolean": {
                      const currentValue =
                        layer.paint?.[paintKey as keyof typeof layer.paint] ??
                        value.default;
                      return (
                        <CheckboxInput
                          value={currentValue}
                          label={`${paintKey} (${currentValue.toString()})`}
                          onChange={(value) =>
                            setLayerPaintProperty(layerId, paintKey, value)
                          }
                        />
                      );
                    }
                    case "tuple": {
                      const currentValue =
                        layer.paint?.[paintKey as keyof typeof layer.paint] ??
                        value.default;

                      return (
                        <TupleInput
                          value={currentValue}
                          label={`${paintKey} (${currentValue.toString()})`}
                          labels={value.types.map(({ name }) => name)}
                          onChange={(value) =>
                            setLayerPaintProperty(layerId, paintKey, value)
                          }
                        />
                      );
                    }
                    case "array": {
                      return (
                        <div className="flex items-center justify-between">
                          <label htmlFor={paintKey}>{paintKey}</label>
                          <div key={paintKey}>Array types coming soon...</div>
                        </div>
                      );
                    }
                  }
                }
              })}
            </div>

            <label htmlFor="layout" className="font-semibold">
              Layout Properties
            </label>
            <div id="layout" className="flex flex-col space-y-1">
              {getLayerLayoutProperties(layer.type).map((layoutKey) => {
                const value = getLayerLayoutPropertyValue(
                  layer.type,
                  layoutKey
                );
                if (value) {
                  switch (value.type) {
                    case "string": {
                      const currentValue =
                        layer.layout?.[
                          layoutKey as keyof typeof layer.layout
                        ] ?? value.default;
                      return (
                        <TextInput
                          value={currentValue}
                          label={`${layoutKey} (${currentValue})`}
                          onChange={(value) =>
                            setLayerLayoutProperty(layerId, layoutKey, value)
                          }
                        />
                      );
                    }
                    case "enum": {
                      const currentValue =
                        layer.layout?.[
                          layoutKey as keyof typeof layer.layout
                        ] ?? value.default;
                      return (
                        <SelectInput
                          value={currentValue}
                          label={`${layoutKey} (${currentValue})`}
                          options={value.values}
                          onChange={(value) =>
                            setLayerLayoutProperty(layerId, layoutKey, value)
                          }
                        />
                      );
                    }
                    case "number": {
                      const currentValue = (layer.layout?.[
                        layoutKey as keyof typeof layer.layout
                      ] ?? value.default) as number;
                      return (
                        <SliderInput
                          value={currentValue}
                          label={`${layoutKey} (${currentValue})`}
                          min={value.min}
                          max={value.max}
                          step={value.step}
                          onChange={(value) =>
                            setLayerLayoutProperty(layerId, layoutKey, value)
                          }
                        />
                      );
                    }
                    case "color": {
                      const currentValue =
                        layer.layout?.[
                          layoutKey as keyof typeof layer.layout
                        ] ?? value.default;
                      return (
                        <ColorInput
                          value={currentValue}
                          label={`${layoutKey} (${currentValue})`}
                          onChange={(value) =>
                            setLayerLayoutProperty(layerId, layoutKey, value)
                          }
                        />
                      );
                    }
                    case "boolean": {
                      const currentValue = (layer.layout?.[
                        layoutKey as keyof typeof layer.layout
                      ] ?? value.default) as boolean;
                      return (
                        <CheckboxInput
                          value={currentValue}
                          label={`${layoutKey} (${currentValue.toString()})`}
                          onChange={(value) =>
                            setLayerLayoutProperty(layerId, layoutKey, value)
                          }
                        />
                      );
                    }
                    case "tuple": {
                      const currentValue = (layer.layout?.[
                        layoutKey as keyof typeof layer.layout
                      ] ?? value.default) as number[];

                      return (
                        <TupleInput
                          value={currentValue}
                          label={`${layoutKey} (${currentValue.toString()})`}
                          labels={value.types.map(({ name }) => name)}
                          onChange={(value) =>
                            setLayerLayoutProperty(layerId, layoutKey, value)
                          }
                        />
                      );
                    }
                    case "array": {
                      return (
                        <div className="flex items-center justify-between">
                          <label htmlFor={layoutKey}>{layoutKey}</label>
                          <div key={layoutKey}>Array types coming soon...</div>
                        </div>
                      );
                    }
                  }
                }
              })}
            </div>

            <label htmlFor="layer" className="font-semibold">
              Generated Layer
            </label>
            <div id="layer" className="flex flex-col space-y-1">
              <pre>{JSON.stringify(layer, null, 2)}</pre>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
