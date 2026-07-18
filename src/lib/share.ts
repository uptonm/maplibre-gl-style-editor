import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { StyleState } from "./store";

const HASH_PREFIX = "#s=";

// Beyond this, links stop pasting cleanly into chat apps and issue trackers;
// the share dialog warns and points at export instead.
export const SHARE_WARN_LENGTH = 12_000;

export function encodeShareHash(state: StyleState): string {
  return (
    HASH_PREFIX +
    compressToEncodedURIComponent(
      JSON.stringify({
        sources: state.sources,
        layers: state.layers,
        layerOrder: state.layerOrder,
      }),
    )
  );
}

export function decodeShareHash(hash: string): StyleState | null {
  if (!hash.startsWith(HASH_PREFIX)) return null;
  const decompressed = decompressFromEncodedURIComponent(
    hash.slice(HASH_PREFIX.length),
  );
  if (!decompressed) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(decompressed);
  } catch {
    return null;
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("sources" in parsed) ||
    !("layers" in parsed) ||
    !Array.isArray((parsed as { layerOrder?: unknown }).layerOrder)
  ) {
    return null;
  }
  return parsed as StyleState;
}
