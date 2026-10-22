import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = [
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
  ];

  return {
    rules: [
      {
        userAgent: "Google-InspectionTool",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
