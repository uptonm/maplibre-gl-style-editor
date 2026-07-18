# Bun modernization & feature expansion — design

**Date:** 2026-07-18
**Goal:** Keep the product mission — quickly style a multi-layer GeoJSON map
and export a ready-to-use style document (a mini Maputnik) — while replacing
the heavyweight scaffolding with a toolchain sized to the problem, and filling
the feature gaps that blocked the export workflow.

## Problem with the old shape

The app is purely client-side, but it shipped a Next.js App Router + tRPC +
t3-env stack whose only server job was reading two bundled GeoJSON files. A
702-line hand-written switch duplicated a subset of the MapLibre style spec
(4 layer types, drifting defaults, missing properties), state lived in a beta
Legend-State build, and the core promise — *export the style* — didn't exist.

## New architecture

- **Toolchain:** Bun end-to-end. `bun ./index.html` is the dev server (HMR),
  `build.ts` uses `Bun.build` with `bun-plugin-tailwind` for a fully static
  `dist/`, `bun test` runs the suite, Biome lints and formats. No Node, no
  bundler config files beyond `bunfig.toml`.
- **UI:** React 19 + Tailwind CSS 4 (`@theme` tokens, dark editor theme) +
  Radix primitives in shadcn-style wrappers (no forwardRef, trimmed to what
  the app uses).
- **State:** zustand store (`src/lib/store.ts`) with `persist` (localStorage)
  and zundo `temporal` for undo/redo. Undo tracks only style state
  (sources/layers/layerOrder), throttled to ~1 step per 300 ms so slider drags
  collapse into single undo steps.
- **Property metadata:** derived at runtime from
  `@maplibre/maplibre-gl-style-spec` (`src/lib/style-spec.ts`). Every paint and
  layout property of the supported layer types gets a typed descriptor
  (number/color/boolean/enum/string/arrays/json) that drives a matching input.
  Adding a layer type is one entry in `SUPPORTED_LAYER_TYPES`.
- **Export/import:** `src/lib/style-io.ts` assembles a valid `version: 8`
  style (validated with `validateStyleMin` in tests), optionally inlining
  GeoJSON, plus a layers-only export; `parseStyle` re-imports style documents,
  keeping GeoJSON sources and supported layers and reporting skipped items.

## Features

- Layers: add (line/fill/circle/symbol/heatmap/fill-extrusion), duplicate,
  delete, rename, hide/show, reorder (topmost-first list), zoom range,
  filter editor, and spec-complete paint/layout inputs with per-property
  reset-to-default and a JSON expression mode.
- Sources: add via file upload, paste, or URL; per-source stats, GeoJSON
  download, delete (cascades to dependent layers).
- Export dialog (full style or layers-only, copy/download), import dialog
  with warnings, live Style JSON panel.
- Basemaps: keyless default (MapLibre demotiles) and blank canvas; MapTiler
  styles unlock via `BUN_PUBLIC_MAPTILER_API_KEY` at build time or a key
  entered in the UI (stored in localStorage).
- Undo/redo with ⌘Z/⇧⌘Z; state persists across reloads; reset-to-demo.

## Decisions & trade-offs

- **No server at all** beats keeping Next for future flexibility (YAGNI); the
  demo data is a static import and remote data is fetched by MapLibre itself.
- **Starter symbol layers pin `text-font: ["Open Sans Semibold"]`** — the only
  font the demotiles glyph server hosts, also available on MapTiler — so
  labels render on every basemap without configuration.
- **Vector/raster sources are out of scope** (import skips them with a
  warning): the tool is for styling *your* GeoJSON quickly, not for editing
  full basemap styles — that's Maputnik's job.

## Testing

`bun test` covers descriptor derivation from the spec, every store operation
(including undo/redo and cascade deletes), and export/import round-trips with
spec validation. UI verified end-to-end in headless Chromium (layer editing
reflected live on the map, undo, export dialog, sources panel, JSON panel).
