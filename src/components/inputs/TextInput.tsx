"use client";

import { Input } from "../ui/input";
import { Label } from "../ui/label";

type TextInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export const TextInput = ({ id, label, value, onChange }: TextInputProps) => {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-36"
      />
    </div>
  );
};
