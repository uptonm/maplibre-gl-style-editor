import { type AppType } from "next/dist/shared/lib/utils";
import { Tooltip } from "react-tooltip";
import { MapEditorContextProvider } from "../context/MapEditorContext";

import "../styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <MapEditorContextProvider>
      <Component {...pageProps} />
      <Tooltip id="action-icon-tooltip" />
    </MapEditorContextProvider>
  );
};

export default MyApp;
