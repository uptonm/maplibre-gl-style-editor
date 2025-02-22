"use client";

import { PropertyValue } from "~/lib/map-utils";
import { CheckboxInput } from "~/components/inputs/CheckboxInput";
import { ColorInput } from "~/components/inputs/ColorInput";
import { SelectInput } from "~/components/inputs/SelectInput";
import { SliderInput } from "~/components/inputs/SliderInput";
import { TextInput } from "~/components/inputs/TextInput";
import { TupleInput } from "~/components/inputs/TupleInput";

type DynamicInputProps<T = unknown> = {
  id: string;
  label: string;
  currentValue: T;
  propertyValue: PropertyValue;
  onChange: (value: T) => void;
};

export function DynamicInput<T = unknown>({
  id,
  label,
  currentValue,
  propertyValue,
  onChange,
}: DynamicInputProps<T>) {
  switch (propertyValue.type) {
    case "string": {
      return (
        <TextInput
          id={id}
          label={label}
          value={currentValue as string}
          onChange={(value) => onChange(value as T)}
        />
      );
    }
    case "enum": {
      return (
        <SelectInput
          id={id}
          label={label}
          value={currentValue as string}
          options={propertyValue.values}
          onChange={(value) => onChange(value as T)}
        />
      );
    }
    case "number": {
      return (
        <SliderInput
          id={id}
          label={label}
          value={+currentValue}
          min={propertyValue.min}
          max={propertyValue.max}
          step={propertyValue.step}
          onChange={(value) => onChange(value as T)}
        />
      );
    }
    case "color": {
      return (
        <ColorInput
          id={id}
          label={label}
          value={currentValue as string}
          onChange={(value) => onChange(value as T)}
        />
      );
    }
    case "boolean": {
      return (
        <CheckboxInput
          label={label}
          value={currentValue as boolean}
          onChange={(value) => onChange(value as T)}
        />
      );
    }
    case "tuple": {
      return (
        <TupleInput
          id={id}
          label={label}
          value={currentValue as number[]}
          labels={propertyValue.types.map(({ name }) => name)}
          onChange={(value) => onChange(value as T)}
        />
      );
    }
    case "array": {
      return (
        <div className="flex items-center justify-between">
          <label htmlFor={label}>{label}</label>
          <div key={label}>Array types coming soon...</div>
        </div>
      );
    }
  }
}
