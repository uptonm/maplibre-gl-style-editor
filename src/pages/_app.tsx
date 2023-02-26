import { type AppType } from "next/dist/shared/lib/utils";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { MapEditorContextProvider } from "../context/MapEditorContext";

import "../styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ErrorBoundary>
      <MapEditorContextProvider>
        <Component {...pageProps} />
      </MapEditorContextProvider>
    </ErrorBoundary>
  );
};

export default MyApp;
