import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { useEditorStore } from "~/lib/store";
import { buildStyle } from "~/lib/style-io";

export function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  return [
    copied,
    (text: string) => {
      void navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    },
  ];
}

export function StyleJsonPanel() {
  const sources = useEditorStore((state) => state.sources);
  const layers = useEditorStore((state) => state.layers);
  const layerOrder = useEditorStore((state) => state.layerOrder);
  const [copied, copy] = useCopy();

  const state = { sources, layers, layerOrder };
  const style = buildStyle(state, { inlineData: true });
  const preview = {
    ...style,
    sources: Object.fromEntries(
      Object.entries(sources).map(([id, source]) => [
        id,
        {
          type: "geojson",
          data:
            typeof source.data === "string"
              ? source.data
              : `‹inline GeoJSON: ${source.data.features.length} features›`,
        },
      ]),
    ),
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Live preview · inline data collapsed
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copy(JSON.stringify(style, null, 2))}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          Copy full style
        </Button>
      </div>
      <pre className="min-h-0 flex-1 overflow-auto p-3 font-mono text-xs leading-relaxed text-muted-foreground">
        {JSON.stringify(preview, null, 2)}
      </pre>
    </div>
  );
}
