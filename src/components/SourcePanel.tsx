import { FC, useCallback, useState } from "react";
import { useMapEditorContext } from "../context/MapEditorContext";

export const SourcePanel = () => {
  const { sources, addSource, setSourceData } = useMapEditorContext();
  const [sourceName, setSourceName] = useState("");

  const handleAddSource = useCallback(() => {
    addSource(sourceName);
    setSourceName("");
  }, [addSource, sourceName]);

  return (
    <div className="w-lg h-full">
      <h2 className="text-xl font-bold">Sources</h2>
      <span>Coming soon...</span>
    </div>
  );
};
