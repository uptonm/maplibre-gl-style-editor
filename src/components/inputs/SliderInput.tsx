"use client";

import { Label } from "../ui/label";
import { Slider } from "../ui/slider";

type SliderInputProps = {
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
};

export const SliderInput = ({
  id,
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
}: SliderInputProps) => {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id}>{label}</Label>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(value) => onChange(value[0]!)}
        className="w-36"
      />
    </div>
  );
};
