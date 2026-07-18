import { useEffect } from "react";
import { Header } from "~/components/header";
import { MapView } from "~/components/map-view";
import { LayersPanel } from "~/components/panels/layers-panel";
import { SourcesPanel } from "~/components/panels/sources-panel";
import { StyleJsonPanel } from "~/components/panels/style-json-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { TooltipProvider } from "~/components/ui/tooltip";
import { useEditorStore } from "~/lib/store";

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

function useUndoShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || isTypingTarget(event.target))
        return;
      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        useEditorStore.temporal.getState().redo();
      } else if (key === "z") {
        event.preventDefault();
        useEditorStore.temporal.getState().undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

export function App() {
  useUndoShortcuts();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full flex-col">
        <Header />
        <main className="flex min-h-0 flex-1">
          <aside className="flex w-[400px] shrink-0 flex-col border-r">
            <Tabs
              defaultValue="layers"
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList className="mx-3 mt-3">
                <TabsTrigger value="layers">Layers</TabsTrigger>
                <TabsTrigger value="sources">Sources</TabsTrigger>
                <TabsTrigger value="json">Style JSON</TabsTrigger>
              </TabsList>
              <TabsContent value="layers" className="min-h-0 flex-1">
                <LayersPanel />
              </TabsContent>
              <TabsContent value="sources" className="min-h-0 flex-1">
                <SourcesPanel />
              </TabsContent>
              <TabsContent value="json" className="min-h-0 flex-1">
                <StyleJsonPanel />
              </TabsContent>
            </Tabs>
          </aside>
          <div className="relative min-w-0 flex-1">
            <MapView />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
