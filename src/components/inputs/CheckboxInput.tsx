"use client";

type CheckboxInputProps = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export const CheckboxInput = ({
  label,
  value,
  onChange,
}: CheckboxInputProps) => {
  return (
    <label className="flex items-center justify-between">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
};
