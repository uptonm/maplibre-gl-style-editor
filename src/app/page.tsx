import { MapViewer } from "~/components/map-viewer";

import { PropertyEditor } from "~/components/property-editor";
import { api, HydrateClient } from "~/trpc/server";

export default async function HomePage() {
  await api.source.getSource.prefetch({ id: "lines" });
  await api.source.getSource.prefetch({ id: "stations" });

  return (
    <HydrateClient>
      <main className="relative flex h-full w-full">
        <aside className="w-full flex-grow md:w-1/2">
          <PropertyEditor />
        </aside>
        <div className="w-full flex-grow">
          <MapViewer />
        </div>
      </main>
    </HydrateClient>
  );
}
