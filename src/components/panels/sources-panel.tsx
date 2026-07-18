import type { FeatureCollection } from "geojson";
import { DatabaseIcon, DownloadIcon, Trash2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  coerceFeatureCollection,
  describeCollection,
  slugify,
} from "~/lib/geo";
import { uniqueId, useEditorStore } from "~/lib/store";

function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/geo+json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function SourceCard({ id }: { id: string }) {
  const source = useEditorStore((state) => state.sources[id]);
  const layers = useEditorStore((state) => state.layers);
  const removeSource = useEditorStore((state) => state.removeSource);
  if (!source) return null;

  const dependents = Object.values(layers).filter(
    (layer) => layer.source === id,
  ).length;

  return (
    <div className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md border text-muted-foreground">
        <DatabaseIcon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{id}</p>
        <p className="truncate text-xs text-muted-foreground">
          {describeCollection(source.data)}
        </p>
      </div>
      <div className="flex shrink-0 items-center">
        {typeof source.data === "object" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Download GeoJSON"
                onClick={() => downloadJson(`${id}.geojson`, source.data)}
              >
                <DownloadIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download GeoJSON</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete source"
              className="hover:text-destructive"
              onClick={() => removeSource(id)}
            >
              <Trash2Icon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {dependents > 0
              ? `Delete source and ${dependents} layer${dependents === 1 ? "" : "s"}`
              : "Delete source"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function AddSourceForm() {
  const sources = useEditorStore((state) => state.sources);
  const addSource = useEditorStore((state) => state.addSource);
  const [name, setName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const add = (data: FeatureCollection | string, fallbackName: string) => {
    const id = uniqueId(slugify(name || fallbackName), sources);
    addSource(id, data);
    setName("");
    setPasteText("");
    setUrl("");
    setError(null);
  };

  const addFromText = (text: string, fallbackName: string) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("Not valid JSON.");
      return;
    }
    const collection = coerceFeatureCollection(parsed);
    if (!collection) {
      setError("Expected a GeoJSON FeatureCollection, Feature, or geometry.");
      return;
    }
    add(collection, fallbackName);
  };

  const onFileChosen = async (file: File) => {
    addFromText(await file.text(), file.name);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-2.5 border-t p-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="source-name">New source name</Label>
        <Input
          id="source-name"
          value={name}
          spellCheck={false}
          placeholder="my-data (optional, derived from file)"
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <Tabs defaultValue="upload">
        <TabsList className="w-full">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="paste">Paste</TabsTrigger>
          <TabsTrigger value="url">URL</TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="pt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.geojson,application/geo+json,application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFileChosen(file);
            }}
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose a .geojson file
          </Button>
        </TabsContent>
        <TabsContent value="paste" className="flex flex-col gap-2 pt-2">
          <Textarea
            rows={4}
            value={pasteText}
            spellCheck={false}
            placeholder='{"type": "FeatureCollection", "features": […]}'
            onChange={(event) => setPasteText(event.target.value)}
          />
          <Button
            className="w-full"
            disabled={pasteText.trim() === ""}
            onClick={() => addFromText(pasteText, "pasted-data")}
          >
            Add source
          </Button>
        </TabsContent>
        <TabsContent value="url" className="flex flex-col gap-2 pt-2">
          <Input
            value={url}
            spellCheck={false}
            placeholder="https://example.com/data.geojson"
            onChange={(event) => setUrl(event.target.value)}
          />
          <Button
            className="w-full"
            disabled={!/^https?:\/\//.test(url)}
            onClick={() => add(url, "remote-data")}
          >
            Add source
          </Button>
        </TabsContent>
      </Tabs>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function SourcesPanel() {
  const sources = useEditorStore((state) => state.sources);
  const sourceIds = Object.keys(sources);

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
        {sourceIds.length === 0 && (
          <p className="px-1 py-6 text-center text-sm text-muted-foreground">
            No sources yet. Add GeoJSON below.
          </p>
        )}
        {sourceIds.map((id) => (
          <SourceCard key={id} id={id} />
        ))}
      </div>
      <AddSourceForm />
    </div>
  );
}
