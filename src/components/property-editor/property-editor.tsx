"use client";

import { useState } from "react";
import { useEffect } from "react";
import { LayersPanel } from "~/components/property-editor/layers-panel";
import { SourcesPanel } from "~/components/property-editor/sources-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export function PropertyEditor() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="h-full pt-4">
      <Tabs defaultValue="layers" className="flex h-full w-full flex-col">
        <TabsList className="mx-4 grid grid-cols-2">
          <TabsTrigger value="layers">Layers</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>
        <TabsContent value="layers" className="flex-grow overflow-hidden">
          <LayersPanel />
        </TabsContent>
        <TabsContent value="sources" className="flex-grow overflow-hidden">
          <SourcesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
