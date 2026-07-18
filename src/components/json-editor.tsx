import { useEffect, useState } from "react";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/cn";

type JsonEditorProps = {
  value: unknown;
  onChange: (value: unknown) => void;
  rows?: number;
  placeholder?: string;
};

export function JsonEditor({
  value,
  onChange,
  rows = 4,
  placeholder,
}: JsonEditorProps) {
  const serialized = value === undefined ? "" : JSON.stringify(value, null, 2);
  const [text, setText] = useState(serialized);
  const [dirty, setDirty] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!dirty) setText(serialized);
  }, [serialized, dirty]);

  const commit = (raw: string) => {
    setText(raw);
    setDirty(true);
    if (raw.trim() === "") {
      setInvalid(false);
      return;
    }
    try {
      onChange(JSON.parse(raw));
      setInvalid(false);
    } catch {
      setInvalid(true);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Textarea
        value={text}
        rows={rows}
        placeholder={placeholder}
        spellCheck={false}
        onChange={(event) => commit(event.target.value)}
        onBlur={() => setDirty(false)}
        className={cn(
          invalid && "border-destructive focus-visible:ring-destructive",
        )}
      />
      {invalid && <p className="text-xs text-destructive">Invalid JSON</p>}
    </div>
  );
}
