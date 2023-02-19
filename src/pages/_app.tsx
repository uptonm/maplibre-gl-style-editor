import { type AppType } from "next/dist/shared/lib/utils";
import { MapEditorContextProvider } from "../context/MapEditorContext";

import "../styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <MapEditorContextProvider>
      <Component {...pageProps} />
    </MapEditorContextProvider>
  );
};

export default MyApp;
