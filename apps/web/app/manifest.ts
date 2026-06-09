import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description:
      "Car maintenance and spare parts in Riyadh — workshop, mobile service, and live order tracking.",
    start_url: "/",
    display: "standalone",
    background_color: "#050B10",
    theme_color: "#94D4B9",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/logos/banner.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
