import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    "/about",
    "/contact",
    "/guide",
    "/resources/job-search-planner",
    "/privacy",
    "/terms",
    "/refunds",
  ].map((path) => ({
    url: new URL(path, siteUrl).toString(),
  }));
}
