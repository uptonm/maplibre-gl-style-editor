type SelectInputProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export const SelectInput = ({
  label,
  value,
  options,
  onChange,
}: SelectInputProps) => {
  return (
    <label className="flex items-center justify-between">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
};
