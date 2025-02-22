"use client";

import { use$ } from "@legendapp/state/react";
import { useCallback, useState } from "react";
import { mapStore$ } from "~/contexts/MapStore";
import { enableReactUse } from "@legendapp/state/config/enableReactUse";

enableReactUse();

export function SourcesPanel() {
  const sources = use$(mapStore$.sources);
  const [sourceName, setSourceName] = useState("");

  const handleAddSource = useCallback(() => {
    mapStore$.addSource(sourceName, {
      type: "FeatureCollection",
      features: [],
    });
    setSourceName("");
  }, [sourceName]);

  return (
    <div className="w-lg h-full">
      <span>Coming soon...</span>
    </div>
  );
}
