import { type AppType } from "next/dist/shared/lib/utils";
import { Tooltip } from "react-tooltip";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { MapEditorContextProvider } from "../context/MapEditorContext";

import "../styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ErrorBoundary>
      <MapEditorContextProvider>
        <Component {...pageProps} />
        <Tooltip id="action-icon-tooltip" />
      </MapEditorContextProvider>
    </ErrorBoundary>
  );
};

export default MyApp;
