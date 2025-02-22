"use client";

type ArrayInputProps = {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
};

export const ArrayInput = ({ label, value, onChange }: ArrayInputProps) => {
  return (
    <label className="flex items-center justify-between">
      <span>{label}</span>
      <input
        value={value.join(",")}
        onChange={(e) => onChange(e.target.value.split(","))}
      />
    </label>
  );
};
