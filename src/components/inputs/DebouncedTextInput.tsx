import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";

type DebouncedTextInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export const DebouncedTextInput = ({
  value,
  onChange,
}: DebouncedTextInputProps) => {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounce the onChange callback so that it's only called once every 500ms
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const debouncedOnChange = useCallback(debounce(onChange, 500), [onChange]);

  return (
    <input
      autoFocus
      type="text"
      value={inputValue}
      onChange={(e) => {
        setInputValue(e.target.value);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        debouncedOnChange(e.target.value);
      }}
      className="text-md w-full rounded-md border border-slate-500 px-1 focus:outline-none focus:ring-4 focus:ring-blue-300"
    />
  );
};
