import {
  DownloadIcon,
  EllipsisVerticalIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  MapIcon,
  Redo2Icon,
  RotateCcwIcon,
  Undo2Icon,
  UploadIcon,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "zustand";
import { ExportDialog } from "~/components/dialogs/export-dialog";
import { ImportDialog } from "~/components/dialogs/import-dialog";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import type { BasemapId } from "~/lib/basemaps";
import { BASEMAPS, envMaptilerKey } from "~/lib/basemaps";
import { resetToDemo, useEditorStore } from "~/lib/store";

function IconAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function UndoRedo() {
  const { undo, redo, pastStates, futureStates } = useStore(
    useEditorStore.temporal,
  );
  return (
    <>
      <IconAction
        label="Undo (⌘Z)"
        onClick={() => undo()}
        disabled={pastStates.length === 0}
      >
        <Undo2Icon />
      </IconAction>
      <IconAction
        label="Redo (⇧⌘Z)"
        onClick={() => redo()}
        disabled={futureStates.length === 0}
      >
        <Redo2Icon />
      </IconAction>
    </>
  );
}

function BasemapPicker() {
  const basemap = useEditorStore((state) => state.basemap);
  const setBasemap = useEditorStore((state) => state.setBasemap);
  const maptilerKey = useEditorStore((state) => state.maptilerKey);
  const hasKey = Boolean(maptilerKey || envMaptilerKey());

  return (
    <Select
      value={basemap}
      onValueChange={(value) => setBasemap(value as BasemapId)}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Basemap" />
      </SelectTrigger>
      <SelectContent>
        {BASEMAPS.map((candidate) => (
          <SelectItem
            key={candidate.id}
            value={candidate.id}
            disabled={candidate.requiresKey && !hasKey}
          >
            {candidate.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MaptilerKeyDialog() {
  const [open, setOpen] = useState(false);
  const maptilerKey = useEditorStore((state) => state.maptilerKey);
  const setMaptilerKey = useEditorStore((state) => state.setMaptilerKey);

  return (
    <>
      <IconAction label="MapTiler API key" onClick={() => setOpen(true)}>
        <KeyRoundIcon />
      </IconAction>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>MapTiler API key</DialogTitle>
          <DialogDescription>
            Unlocks the MapTiler basemaps. Stored only in this browser&apos;s
            local storage. Without a key the editor uses the free MapLibre demo
            tiles.
          </DialogDescription>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maptiler-key">API key</Label>
            <Input
              id="maptiler-key"
              value={maptilerKey}
              onChange={(event) => setMaptilerKey(event.target.value.trim())}
              placeholder={envMaptilerKey() ? "Using build-time key" : "…"}
              autoComplete="off"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Header() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
      <div className="flex items-center gap-2 pr-2">
        <MapIcon className="size-5 text-primary" />
        <h1 className="text-sm font-semibold">MapLibre Style Editor</h1>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <UndoRedo />
        <div className="mx-1 h-5 w-px bg-border" />
        <BasemapPicker />
        <MaptilerKeyDialog />
        <div className="mx-1 h-5 w-px bg-border" />
        <ImportDialog>
          <Button variant="outline">
            <UploadIcon />
            Import
          </Button>
        </ImportDialog>
        <ExportDialog>
          <Button>
            <DownloadIcon />
            Export
          </Button>
        </ExportDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More">
              <EllipsisVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a
                href="https://github.com/uptonm/maplibre-gl-style-editor"
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLinkIcon />
                GitHub
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => resetToDemo()}
            >
              <RotateCcwIcon />
              Reset to demo data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
