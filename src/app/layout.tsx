import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";

import { TRPCReactProvider } from "~/trpc/react";
import { TooltipProvider } from "~/components/ui/tooltip";

const siteUrl = "https://map.uptonm.dev";
const title = "MapLibre GL Style Editor — Live Map Styling";
const description =
  "Edit MapLibre paint, layout, zoom, and filter properties against a live browser-based map preview.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  title,
  description,
  applicationName: "MapLibre GL Style Editor",
  authors: [{ name: "Mike Upton", url: "https://uptonm.dev" }],
  creator: "Mike Upton",
  publisher: "Mike Upton",
  category: "developer tools",
  keywords: [
    "MapLibre",
    "map style editor",
    "MapLibre GL",
    "GeoJSON",
    "cartography",
    "web mapping",
  ],
  manifest: "/manifest.webmanifest",
  openGraph: {
    title,
    description,
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "MapLibre GL Style Editor",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "MapLibre GL Style Editor — edit map styles against a live preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MapLibre GL Style Editor",
  url: siteUrl,
  description,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  isAccessibleForFree: true,
  author: {
    "@type": "Person",
    name: "Mike Upton",
    url: "https://uptonm.dev",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body className="h-screen w-screen overflow-hidden">
        <TRPCReactProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </TRPCReactProvider>
        <Analytics />
      </body>
    </html>
  );
}
