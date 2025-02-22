"use client";

import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "~/components/ui/select";

type SelectInputProps = {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export const SelectInput = ({
  id,
  label,
  value,
  options,
  onChange,
}: SelectInputProps) => {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(value) => onChange(value)}>
        <SelectTrigger className="max-w-36">{value}</SelectTrigger>
        <SelectContent className="max-w-36">
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
