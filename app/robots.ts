import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Prevent crawling of view-based query entry points now that we have clean URLs
          "/*?view=",
          "/*&view=",
        ],
      },
    ],
    sitemap: "https://rankf1.com/sitemap.xml",
  };
}