"use client";

import { ColorPicker } from "~/components/ui/color";
import { Label } from "~/components/ui/label";

type ColorInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export const ColorInput = ({ id, label, value, onChange }: ColorInputProps) => {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id}>{label}</Label>
      <ColorPicker
        color={value}
        setColor={(color) => onChange(color)}
        className="max-w-36"
      />
    </div>
  );
};
