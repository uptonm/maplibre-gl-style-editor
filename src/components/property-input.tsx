import { BracesIcon, RotateCcwIcon } from "lucide-react";
import { useRef, useState } from "react";
import { JsonEditor } from "~/components/json-editor";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/cn";
import type { PropertyDescriptor } from "~/lib/style-spec";
import {
  isExpressionValue,
  validatePropertyExpression,
} from "~/lib/style-spec";

type PropertyInputProps = {
  name: string;
  descriptor: PropertyDescriptor;
  value: unknown;
  onChange: (value: unknown) => void;
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function NumberEditor({
  descriptor,
  value,
  onChange,
}: {
  descriptor: Extract<PropertyDescriptor, { kind: "number" }>;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Slider
        min={descriptor.min}
        max={descriptor.max}
        step={descriptor.step}
        value={[Math.min(Math.max(value, descriptor.min), descriptor.max)]}
        onValueChange={([next]) => next !== undefined && onChange(next)}
      />
      <Input
        type="number"
        step={descriptor.step}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (!Number.isNaN(next)) onChange(next);
        }}
        className="w-20 shrink-0 text-right"
      />
    </div>
  );
}

function ColorEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={HEX_COLOR.test(value) ? value : "#000000"}
        onChange={(event) => onChange(event.target.value)}
        className="size-8 shrink-0 cursor-pointer rounded-md border border-input bg-background p-0.5"
        aria-label="Pick color"
      />
      <Input
        value={value}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        className="font-mono text-xs"
      />
    </div>
  );
}

function NumberTupleEditor({
  length,
  value,
  onChange,
}: {
  length: number;
  value: number[];
  onChange: (value: number[]) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length }, (_, index) => (
        <Input
          // biome-ignore lint/suspicious/noArrayIndexKey: tuple slots are positional
          key={index}
          type="number"
          value={value[index] ?? 0}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isNaN(next)) return;
            const tuple = Array.from({ length }, (_, i) => value[i] ?? 0);
            tuple[index] = next;
            onChange(tuple);
          }}
          className="text-right"
        />
      ))}
    </div>
  );
}

function DelimitedEditor({
  value,
  onCommit,
  parse,
}: {
  value: string;
  onCommit: (raw: string) => void;
  parse?: "number";
}) {
  const [text, setText] = useState(value);
  const [editing, setEditing] = useState(false);
  return (
    <Input
      value={editing ? text : value}
      spellCheck={false}
      placeholder={parse === "number" ? "e.g. 2, 1" : "comma-separated"}
      onFocus={() => {
        setText(value);
        setEditing(true);
      }}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => {
        setEditing(false);
        onCommit(text);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className="font-mono text-xs"
    />
  );
}

function Editor({
  descriptor,
  value,
  onChange,
}: {
  descriptor: PropertyDescriptor;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (descriptor.kind) {
    case "number":
      return (
        <NumberEditor
          descriptor={descriptor}
          value={typeof value === "number" ? value : descriptor.default}
          onChange={onChange}
        />
      );
    case "color":
      return (
        <ColorEditor
          value={typeof value === "string" ? value : descriptor.default}
          onChange={onChange}
        />
      );
    case "boolean":
      return (
        <Switch
          checked={typeof value === "boolean" ? value : descriptor.default}
          onCheckedChange={onChange}
        />
      );
    case "enum":
      return (
        <Select
          value={typeof value === "string" ? value : descriptor.default}
          onValueChange={onChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {descriptor.values.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "string":
      return (
        <Input
          value={typeof value === "string" ? value : descriptor.default}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case "number-array": {
      const current = Array.isArray(value)
        ? (value as number[])
        : descriptor.default;
      if (descriptor.length) {
        return (
          <NumberTupleEditor
            length={descriptor.length}
            value={current}
            onChange={onChange}
          />
        );
      }
      return (
        <DelimitedEditor
          value={current.join(", ")}
          parse="number"
          onCommit={(raw) => {
            const numbers = raw
              .split(",")
              .map((part) => Number(part.trim()))
              .filter((part) => !Number.isNaN(part));
            onChange(numbers.length > 0 ? numbers : undefined);
          }}
        />
      );
    }
    case "string-array": {
      const current = Array.isArray(value)
        ? (value as string[])
        : descriptor.default;
      return (
        <DelimitedEditor
          value={current.join(", ")}
          onCommit={(raw) => {
            const parts = raw
              .split(",")
              .map((part) => part.trim())
              .filter(Boolean);
            onChange(parts.length > 0 ? parts : undefined);
          }}
        />
      );
    }
    case "json":
      return (
        <JsonEditor value={value ?? descriptor.default} onChange={onChange} />
      );
  }
}

function expressionPlaceholder(descriptor: PropertyDescriptor): string {
  const parameters = descriptor.expression?.parameters ?? [];
  if (parameters.includes("feature")) return 'e.g. ["get", "property-name"]';
  if (parameters.includes("zoom"))
    return 'e.g. ["interpolate", ["linear"], ["zoom"], 5, …, 15, …]';
  return 'e.g. ["literal", …]';
}

function expressionHint(descriptor: PropertyDescriptor): string {
  const contexts = (descriptor.expression?.parameters ?? [])
    .map(
      (parameter) =>
        (
          ({
            zoom: "zoom",
            feature: "feature data",
            "feature-state": "feature state",
            "global-state": "global state",
          }) as Record<string, string>
        )[parameter] ?? parameter,
    )
    .join(", ");
  const returnType = descriptor.raw.type;
  return contexts
    ? `expression → ${returnType} · inputs: ${contexts}`
    : `expression → ${returnType}`;
}

export function PropertyInput({
  name,
  descriptor,
  value,
  onChange,
}: PropertyInputProps) {
  const isSet = value !== undefined;
  const valueIsExpression = isExpressionValue(value);
  const supportsExpressions =
    descriptor.expression !== undefined && descriptor.kind !== "json";
  const [expressionMode, setExpressionMode] = useState(false);
  // Remembered so leaving expression mode can restore the previous plain
  // value instead of dumping the user at the spec default.
  const preExpressionValue = useRef<unknown>(undefined);
  const showJson =
    descriptor.kind === "json" || expressionMode || valueIsExpression;

  const toggleExpressionMode = () => {
    if (showJson) {
      setExpressionMode(false);
      if (isExpressionValue(value)) onChange(preExpressionValue.current);
    } else {
      preExpressionValue.current = value;
      setExpressionMode(true);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "truncate font-mono text-xs",
            isSet ? "text-foreground" : "text-muted-foreground",
          )}
          title={name}
        >
          {name}
          {descriptor.kind === "number" && descriptor.units && (
            <span className="ml-1 text-muted-foreground">
              ({descriptor.units})
            </span>
          )}
        </span>
        <div className="flex shrink-0 items-center gap-0.5">
          {supportsExpressions && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={
                    showJson
                      ? `Stop editing ${name} as expression`
                      : `Edit ${name} as expression`
                  }
                  className={cn(showJson && "text-primary")}
                  onClick={toggleExpressionMode}
                >
                  <BracesIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showJson
                  ? valueIsExpression
                    ? "Discard expression, back to control"
                    : "Back to control"
                  : "Edit as expression"}
              </TooltipContent>
            </Tooltip>
          )}
          {isSet && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Reset ${name}`}
                  onClick={() => {
                    setExpressionMode(false);
                    onChange(undefined);
                  }}
                >
                  <RotateCcwIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset to default</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      {showJson ? (
        <>
          <JsonEditor
            value={value ?? descriptor.default}
            onChange={onChange}
            validate={(candidate) =>
              validatePropertyExpression(descriptor, name, candidate)
            }
            placeholder={expressionPlaceholder(descriptor)}
          />
          <p className="text-[11px] leading-tight text-muted-foreground">
            {expressionHint(descriptor)}
          </p>
        </>
      ) : (
        <Editor descriptor={descriptor} value={value} onChange={onChange} />
      )}
    </div>
  );
}
