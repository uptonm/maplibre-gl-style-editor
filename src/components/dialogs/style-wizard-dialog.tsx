import { WandSparklesIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useEditorStore } from "~/lib/store";
import type { EditorLayer } from "~/lib/style-spec";
import {
  analyzeProperties,
  buildColorExpression,
  categoricalColorPairs,
  colorTargetFor,
  RAMP_COLORS,
} from "~/lib/style-wizard";

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-md border px-2 py-1">
      <span
        className="size-3 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <span className="truncate font-mono text-xs">{label}</span>
    </span>
  );
}

export function StyleWizardDialog({ layer }: { layer: EditorLayer }) {
  const sources = useEditorStore((state) => state.sources);
  const setPaintProperty = useEditorStore((state) => state.setPaintProperty);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const target = colorTargetFor(layer.type);
  const data = sources[layer.source]?.data;
  const analyzed =
    target && typeof data === "object" ? analyzeProperties(data) : [];
  const selected =
    analyzed.find((property) => property.name === selectedName) ?? analyzed[0];

  if (!target || analyzed.length === 0) return null;

  const apply = () => {
    if (!selected) return;
    setPaintProperty(layer.id, target, buildColorExpression(selected));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <WandSparklesIcon />
          Color by data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Color by data</DialogTitle>
        <DialogDescription>
          Generates a {target} expression from a feature property — tweak it
          afterwards in the property&apos;s expression editor.
        </DialogDescription>

        <div className="flex flex-col gap-1.5">
          <Label>Feature property</Label>
          <Select
            value={selected?.name}
            onValueChange={(name) => setSelectedName(name)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {analyzed.map((property) => (
                <SelectItem key={property.name} value={property.name}>
                  {property.name} ·{" "}
                  {property.kind === "categorical"
                    ? `${property.values.length} categories`
                    : `${property.min}–${property.max}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected && (
          <div className="flex flex-wrap gap-1.5">
            {selected.kind === "categorical" ? (
              categoricalColorPairs(selected).map(([value, color]) => (
                <Swatch key={value} color={color} label={value} />
              ))
            ) : (
              <>
                <Swatch color={RAMP_COLORS.low} label={String(selected.min)} />
                <span className="self-center text-xs text-muted-foreground">
                  →
                </span>
                <Swatch color={RAMP_COLORS.high} label={String(selected.max)} />
              </>
            )}
          </div>
        )}

        <DialogClose asChild>
          <Button onClick={apply}>Apply</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
