type SliderInputProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
};

export const SliderInput = ({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
}: SliderInputProps) => {
  return (
    <label className="flex items-center justify-between">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
    </label>
  );
};
