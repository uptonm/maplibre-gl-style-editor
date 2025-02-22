"use client";

import { useCallback, useState } from "react";
import { useMapEditorContext } from "~/contexts/MapContext";

export function SourcesPanel() {
  const { sources, addSource, setSourceData } = useMapEditorContext();
  const [sourceName, setSourceName] = useState("");

  const handleAddSource = useCallback(() => {
    addSource(sourceName);
    setSourceName("");
  }, [addSource, sourceName]);

  return (
    <div className="w-lg h-full">
      <span>Coming soon...</span>
    </div>
  );
}
