import type {
  SymbolLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  CircleLayerSpecification,
  SymbolPaintProps,
  FillPaintProps,
  LinePaintProps,
  CirclePaintProps,
} from "maplibre-gl";

export type SupportedLayerSpecification =
  | SymbolLayerSpecification
  | FillLayerSpecification
  | LineLayerSpecification
  | CircleLayerSpecification;

export type SupportedLayerType = SupportedLayerSpecification["type"];

export type SupportedLayerPaintProperty<
  LayerType extends SupportedLayerSpecification
> = LayerType extends SymbolLayerSpecification
  ? keyof SymbolPaintProps
  : LayerType extends FillLayerSpecification
  ? keyof FillPaintProps
  : LayerType extends LineLayerSpecification
  ? keyof LinePaintProps
  : LayerType extends CircleLayerSpecification
  ? keyof CirclePaintProps
  : never;

export type SupportedLayerLayoutProperty =
  keyof Required<SupportedLayerSpecification>["layout"];
