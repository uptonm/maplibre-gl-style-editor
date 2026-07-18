import { UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { useEditorStore } from "~/lib/store";
import { parseStyle } from "~/lib/style-io";

export function ImportDialog({ children }: { children: React.ReactNode }) {
  const replaceStyle = useEditorStore((state) => state.replaceStyle);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importText = (raw: string) => {
    const result = parseStyle(raw);
    if (!result.ok) {
      setError(result.error);
      setWarnings([]);
      return;
    }
    replaceStyle(result.state);
    if (result.warnings.length > 0) {
      // Keep the dialog open so skipped-item warnings are visible.
      setError(null);
      setWarnings(result.warnings);
      setText("");
      return;
    }
    setOpen(false);
    setText("");
    setError(null);
    setWarnings([]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError(null);
          setWarnings([]);
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogTitle>Import style</DialogTitle>
        <DialogDescription>
          Paste or upload a MapLibre style document. GeoJSON sources and
          supported layers replace the current editor state — undo brings the
          old state back.
        </DialogDescription>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) importText(await file.text());
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <UploadIcon />
          Choose a style.json file
        </Button>

        <div className="flex flex-col gap-2">
          <Textarea
            rows={8}
            value={text}
            spellCheck={false}
            placeholder='{"version": 8, "sources": {…}, "layers": […]}'
            onChange={(event) => setText(event.target.value)}
          />
          <Button
            disabled={text.trim() === ""}
            onClick={() => importText(text)}
          >
            Import
          </Button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        {warnings.length > 0 && (
          <div className="rounded-md border border-border bg-secondary/50 p-2.5 text-xs text-muted-foreground">
            <p className="pb-1 font-medium text-foreground">
              Imported with warnings:
            </p>
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
