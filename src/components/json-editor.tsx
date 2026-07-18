import { useEffect, useState } from "react";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/cn";

type JsonEditorProps = {
  value: unknown;
  onChange: (value: unknown) => void;
  // Extra checks beyond JSON syntax (e.g. expression validation); a commit
  // only happens when this returns no errors.
  validate?: (value: unknown) => string[];
  rows?: number;
  placeholder?: string;
};

export function JsonEditor({
  value,
  onChange,
  validate,
  rows = 4,
  placeholder,
}: JsonEditorProps) {
  const serialized = value === undefined ? "" : JSON.stringify(value, null, 2);
  const [text, setText] = useState(serialized);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!dirty) setText(serialized);
  }, [serialized, dirty]);

  const commit = (raw: string) => {
    setText(raw);
    setDirty(true);
    if (raw.trim() === "") {
      setErrors([]);
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setErrors(["Invalid JSON"]);
      return;
    }
    const validationErrors = validate?.(parsed) ?? [];
    setErrors(validationErrors);
    if (validationErrors.length === 0) onChange(parsed);
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
          errors.length > 0 &&
            "border-destructive focus-visible:ring-destructive",
        )}
      />
      {errors.map((error) => (
        <p key={error} className="text-xs text-destructive">
          {error}
        </p>
      ))}
    </div>
  );
}
