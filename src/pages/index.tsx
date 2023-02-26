import { Tab } from "@headlessui/react";
import classNames from "classnames";
import { type NextPage } from "next";
import Head from "next/head";
import { Tooltip } from "react-tooltip";
import { LayersPanel } from "../components/LayerPanel";
import { Map } from "../components/Map";
import { SourcePanel } from "../components/SourcePanel";

const tabs = [
  { key: "layers", name: "Layers", component: LayersPanel },
  { key: "sources", name: "Sources", component: SourcePanel },
];

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>maplibre-gl style editor</title>
        <meta
          name="description"
          content="Some SEO nonesense should probably go here"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-screen w-screen">
        <aside className="flex h-full w-full flex-col md:w-1/2">
          <Tab.Group>
            <Tab.List className="m-2 flex space-x-1 rounded-xl bg-slate-500/20 p-1">
              {tabs.map((tab) => (
                <Tab
                  key={tab.key}
                  className={({ selected }) =>
                    classNames(
                      "w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-slate-700",
                      "ring-white ring-opacity-60 ring-offset-2 ring-offset-slate-400 focus:outline-none focus:ring-2",
                      selected ? "bg-white shadow" : "hover:bg-white/[0.25]"
                    )
                  }
                >
                  {tab.name}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="mt-2 flex-grow overflow-auto">
              {tabs.map((tab) => (
                <Tab.Panel
                  key={tab.key}
                  className={classNames(
                    "bg-white p-3",
                    "ring-white ring-opacity-60 ring-offset-2 ring-offset-slate-400 focus:outline-none focus:ring-2"
                  )}
                >
                  <tab.component />
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </aside>
        <main role="main" className="h-full w-full">
          <Map />
        </main>
        <Tooltip id="action-icon-tooltip" />
      </div>
    </>
  );
};

export default Home;
