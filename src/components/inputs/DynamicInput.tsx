import { PropertyValue } from "../../lib/utils";
import { CheckboxInput } from "./CheckboxInput";
import { ColorInput } from "./ColorInput";
import { SelectInput } from "./SelectInput";
import { SliderInput } from "./SliderInput";
import { TextInput } from "./TextInput";
import { TupleInput } from "./TupleInput";

type DynamicInputProps<T = unknown> = {
  label: string;
  currentValue: T;
  propertyValue: PropertyValue;
  onChange: (value: T) => void;
};

export function DynamicInput<T = unknown>({
  label,
  currentValue,
  propertyValue,
  onChange,
}: DynamicInputProps<T>) {
  switch (propertyValue.type) {
    case "string": {
      return (
        <TextInput
          label={label}
          value={currentValue as string}
          onChange={(value) => onChange(value as T)}
        />
      );
    }
    case "enum": {
      return (
        <SelectInput
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
