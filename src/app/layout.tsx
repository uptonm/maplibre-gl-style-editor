import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";

import { TRPCReactProvider } from "~/trpc/react";
import { TooltipProvider } from "~/components/ui/tooltip";

export const metadata: Metadata = {
  title: "MapGL Style Editor",
  description: "Lightweight, real-time map style editor",
  icons: [{ rel: "icon", url: "https://img.icons8.com/ios-filled/50/m.png" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable}`}
      suppressHydrationWarning
    >
      <body className="h-screen w-screen overflow-hidden">
        <TRPCReactProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </TRPCReactProvider>
        <Analytics />
      </body>
    </html>
  );
}
