import type { MetadataRoute } from "next";
import { absoluteUrl, PUBLIC_SITEMAP_PATHS } from "@/lib/seo";

const PRIORITY: Record<(typeof PUBLIC_SITEMAP_PATHS)[number], number> = {
  "/": 1,
  "/services": 0.9,
  "/request": 0.9,
  "/spare-parts": 0.85,
  "/about": 0.7,
  "/contact": 0.7,
  "/locations": 0.75,
};

const CHANGE_FREQ: Record<
  (typeof PUBLIC_SITEMAP_PATHS)[number],
  MetadataRoute.Sitemap[number]["changeFrequency"]
> = {
  "/": "weekly",
  "/services": "weekly",
  "/request": "weekly",
  "/spare-parts": "weekly",
  "/about": "monthly",
  "/contact": "monthly",
  "/locations": "monthly",
};

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: CHANGE_FREQ[path],
    priority: PRIORITY[path],
  }));
}
