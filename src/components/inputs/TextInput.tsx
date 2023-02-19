type TextInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export const TextInput = ({ label, value, onChange }: TextInputProps) => {
  return (
    <label className="flex items-center justify-between">
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
};
