"use client";

import { type ExpressionSpecification } from "maplibre-gl";

export type ExpressionInputProps = {
  value: ExpressionSpecification;
  onChange: (value: ExpressionSpecification) => void;
};

export function ExpressionInput({ value, onChange }: ExpressionInputProps) {
  return <span />;
}
