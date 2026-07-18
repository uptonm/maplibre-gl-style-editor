import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://map.uptonm.dev",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
