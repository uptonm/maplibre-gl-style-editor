import { CheckIcon, CopyIcon } from "lucide-react";
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
import { Input } from "~/components/ui/input";
import { encodeShareHash, SHARE_WARN_LENGTH } from "~/lib/share";
import { useEditorStore } from "~/lib/store";

export function ShareDialog({ children }: { children: React.ReactNode }) {
  const [url, setUrl] = useState("");
  const [copied, copy] = useCopy();

  const buildUrl = () => {
    const { sources, layers, layerOrder } = useEditorStore.getState();
    setUrl(
      location.origin +
        location.pathname +
        encodeShareHash({ sources, layers, layerOrder }),
    );
  };

  return (
    <Dialog onOpenChange={(open) => open && buildUrl()}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogTitle>Share this style</DialogTitle>
        <DialogDescription>
          The whole style — sources included — is compressed into the link
          itself. Opening it loads the style into the recipient&apos;s editor.
        </DialogDescription>
        <div className="flex items-center gap-2">
          <Input readOnly value={url} className="font-mono text-xs" />
          <Button onClick={() => copy(url)} className="shrink-0">
            {copied ? <CheckIcon /> : <CopyIcon />}
            Copy link
          </Button>
        </div>
        {url.length > SHARE_WARN_LENGTH && (
          <p className="text-xs text-muted-foreground">
            This link is {Math.round(url.length / 1000)}k characters — some chat
            apps and trackers truncate URLs that long. For big datasets, Export
            a style.json instead.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
