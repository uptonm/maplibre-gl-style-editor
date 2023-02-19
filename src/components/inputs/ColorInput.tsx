type ColorInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export const ColorInput = ({ label, value, onChange }: ColorInputProps) => {
  return (
    <label className="flex items-center justify-between">
      <span>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
};
