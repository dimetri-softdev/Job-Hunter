import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/analytics",
        "/roadmaps",
        "/applications",
        "/settings",
        "/admin",
        "/billing",
        "/feedback",
        "/resume-update",
        "/assistant",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/auth/",
      ],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
