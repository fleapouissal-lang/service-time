import type { MetadataRoute } from "next";
import { getServerI18n } from "@/lib/i18n/server";
import { SITE_NAME } from "@/lib/seo";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { t, locale } = await getServerI18n();

  return {
    id: "/",
    name: t.meta.siteTitle,
    short_name: SITE_NAME,
    description: t.meta.siteDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#050B10",
    theme_color: "#94D4B9",
    lang: locale,
    dir: locale === "ar" ? "rtl" : "ltr",
    categories: ["business", "automotive"],
    icons: [
      {
        src: "/logos/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logos/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logos/banner.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logos/banner.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
