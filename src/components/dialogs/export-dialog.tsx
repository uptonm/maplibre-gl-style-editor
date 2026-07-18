import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";
import { useState } from "react";
import { useCopy } from "~/components/panels/style-json-panel";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { useEditorStore } from "~/lib/store";
import { buildStyle, exportLayers } from "~/lib/style-io";

function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function CopyDownloadRow({
  title,
  detail,
  json,
  filename,
}: {
  title: string;
  detail: string;
  json: string;
  filename: string;
}) {
  const [copied, copy] = useCopy();
  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <Button variant="outline" size="sm" onClick={() => copy(json)}>
        {copied ? <CheckIcon /> : <CopyIcon />}
        Copy
      </Button>
      <Button size="sm" onClick={() => downloadText(filename, json)}>
        <DownloadIcon />
        Download
      </Button>
    </div>
  );
}

export function ExportDialog({ children }: { children: React.ReactNode }) {
  const sources = useEditorStore((state) => state.sources);
  const layers = useEditorStore((state) => state.layers);
  const layerOrder = useEditorStore((state) => state.layerOrder);
  const [inlineData, setInlineData] = useState(true);

  const state = { sources, layers, layerOrder };
  const styleJson = JSON.stringify(buildStyle(state, { inlineData }), null, 2);
  const layersJson = JSON.stringify(exportLayers(state), null, 2);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogTitle>Export style</DialogTitle>
        <DialogDescription>
          Drop the style document into any MapLibre (or Mapbox GL) map, or take
          just the layers to merge into an existing style.
        </DialogDescription>

        <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
          <div>
            <Label htmlFor="inline-data">Inline GeoJSON data</Label>
            <p className="text-xs text-muted-foreground">
              Off replaces inline data with placeholder URLs to fill in later.
            </p>
          </div>
          <Switch
            id="inline-data"
            checked={inlineData}
            onCheckedChange={setInlineData}
          />
        </div>

        <CopyDownloadRow
          title="Full style document"
          detail={`version 8 · ${Object.keys(sources).length} sources · ${layerOrder.length} layers`}
          json={styleJson}
          filename="style.json"
        />
        <CopyDownloadRow
          title="Layers only"
          detail="Array of layer definitions, in draw order"
          json={layersJson}
          filename="layers.json"
        />
      </DialogContent>
    </Dialog>
  );
}
