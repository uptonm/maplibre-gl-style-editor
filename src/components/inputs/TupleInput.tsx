"use client";

import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";

type TupleInputProps = {
  id: string;
  label: string;
  value: number[];
  labels: string[];
  onChange: (value: number[]) => void;
};

export const TupleInput = ({ id, label, value, onChange }: TupleInputProps) => {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id}>{label}</Label>
      <div id={id} className="flex w-full max-w-36 space-x-2">
        {value.map((v, i) => (
          <Input
            key={i}
            type="number"
            className="w-full"
            value={v}
            onChange={({ target }) => {
              const newValue = [...value];
              newValue[i] = +target.value;
              onChange(newValue);
            }}
          />
        ))}
      </div>
    </div>
  );
};
