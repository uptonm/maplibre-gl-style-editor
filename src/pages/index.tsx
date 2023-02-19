import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { LayerStyleEditor } from "../components/LayerStyleEditor";
import { Map } from "../components/Map";

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
        <aside className="w-full md:w-1/2">
          <LayerStyleEditor />
        </aside>
        <main role="main" className="h-full w-full">
          <Map />
        </main>
      </div>
    </>
  );
};

export default Home;
