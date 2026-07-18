import { ClerkProvider } from "@clerk/clerk-react";
import { type ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const signInUrl =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "https://uptonm.dev/sign-in";
const signUpUrl =
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "https://uptonm.dev/sign-up";

function withClerk(children: ReactNode) {
  if (!publishableKey) return children;
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
    >
      {children}
    </ClerkProvider>
  );
}

createRoot(root).render(<StrictMode>{withClerk(<App />)}</StrictMode>);
