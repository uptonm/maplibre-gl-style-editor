type TupleInputProps = {
  label: string;
  value: number[];
  labels: string[];
  onChange: (value: number[]) => void;
};

export const TupleInput = ({
  label,
  value,
  labels,
  onChange,
}: TupleInputProps) => {
  return (
    <label className="flex items-center justify-between">
      <span className="whitespace-nowrap">{label}</span>
      <div className="flex">
        {value.map((v, i) => (
          <input
            key={i}
            type="number"
            className="w-8"
            value={v}
            onChange={(e) => {
              const newValue = [...value];
              newValue[i] = +e.target.value;
              onChange(newValue);
            }}
          />
        ))}
      </div>
    </label>
  );
};
