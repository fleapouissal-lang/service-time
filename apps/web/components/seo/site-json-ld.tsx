import type { Locale } from "@/lib/i18n/config";
import {
  SITE_EMAIL,
  SITE_NAME,
  SITE_PHONE,
  absoluteUrl,
  getSiteUrl,
} from "@/lib/seo";

type SiteJsonLdProps = {
  locale: Locale;
  description: string;
};

export function SiteJsonLd({ locale, description }: SiteJsonLdProps) {
  const siteUrl = getSiteUrl();
  const inLanguage = locale === "ar" ? "ar-SA" : "en-SA";

  const graph = [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: SITE_NAME,
      url: siteUrl,
      logo: absoluteUrl("/logos/banner.png"),
      email: SITE_EMAIL,
      telephone: SITE_PHONE,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Riyadh",
        addressRegion: "Riyadh",
        addressCountry: "SA",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: SITE_NAME,
      description,
      inLanguage,
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "AutoRepair",
      "@id": `${siteUrl}/#business`,
      name: SITE_NAME,
      url: siteUrl,
      description,
      image: absoluteUrl("/logos/banner.png"),
      telephone: SITE_PHONE,
      email: SITE_EMAIL,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Riyadh",
        addressRegion: "Riyadh",
        addressCountry: "SA",
      },
      areaServed: {
        "@type": "City",
        name: "Riyadh",
      },
      priceRange: "$$",
    },
  ];

  const payload = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
