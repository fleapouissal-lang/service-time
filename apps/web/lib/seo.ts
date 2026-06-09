import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";

export const SITE_NAME = "Service Time";
export const DEFAULT_OG_IMAGE = "/logos/banner.png";
export const SITE_EMAIL = "info@servicetime.sa";
export const SITE_PHONE = "+966500000001";

/** Public marketing routes included in sitemap.xml */
export const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/services",
  "/spare-parts",
  "/request",
  "/about",
  "/contact",
  "/locations",
] as const;

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (envUrl) return envUrl;

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

export function ogLocale(locale: Locale): string {
  return locale === "ar" ? "ar_SA" : "en_SA";
}

type BuildPageMetadataInput = {
  title: string;
  description: string;
  pathname: string;
  locale: Locale;
  keywords?: string[];
  noIndex?: boolean;
  ogImage?: string;
  /** Use full title on home/marketing landings without the layout template suffix. */
  absoluteTitle?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  pathname,
  locale,
  keywords,
  noIndex = false,
  ogImage = DEFAULT_OG_IMAGE,
  absoluteTitle = false,
}: BuildPageMetadataInput): Metadata {
  const url = absoluteUrl(pathname);
  const imageUrl = absoluteUrl(ogImage);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: ogLocale(locale),
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large" as const,
            "max-snippet": -1,
          },
        },
  };
}

type BuildSiteMetadataInput = {
  locale: Locale;
  siteTitle: string;
  siteDescription: string;
  keywords?: string[];
};

export function buildSiteMetadata({
  locale,
  siteTitle,
  siteDescription,
  keywords,
}: BuildSiteMetadataInput): Metadata {
  const url = getSiteUrl();
  const imageUrl = absoluteUrl(DEFAULT_OG_IMAGE);

  return {
    metadataBase: new URL(url),
    title: {
      default: siteTitle,
      template: `%s | ${SITE_NAME}`,
    },
    description: siteDescription,
    applicationName: SITE_NAME,
    ...(keywords?.length ? { keywords } : {}),
    authors: [{ name: SITE_NAME, url }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    formatDetection: {
      telephone: true,
      email: true,
    },
    icons: {
      icon: "/logos/icon.png",
      shortcut: "/logos/icon.png",
      apple: "/logos/icon.png",
    },
    openGraph: {
      type: "website",
      locale: ogLocale(locale),
      url: absoluteUrl("/"),
      siteName: SITE_NAME,
      title: siteTitle,
      description: siteDescription,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export const NO_INDEX_METADATA: Metadata = {
  robots: { index: false, follow: false },
};
