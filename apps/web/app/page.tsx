import type { Metadata } from "next";
import { HeroImageSlider } from "@/components/home/hero-image-slider";
import { ServicesCatalogSection } from "@/components/services/services-catalog-section";
import { HomeCtaSection } from "@/components/home/home-cta-section";
import { HomeLocationsSection } from "@/components/home/home-locations-section";
import { HomeSparePartsSection } from "@/components/home/home-spare-parts-section";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { getServerI18n } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/seo";
import { getLatestSpareParts, getWorkshops } from "@/lib/queries";
import { getServiceCatalogSession } from "@/lib/services-catalog-session";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildPageMetadata({
    title: t.meta.siteTitle,
    description: t.meta.descriptions.home,
    pathname: "/",
    locale,
    keywords: t.meta.keywords.split(",").map((k) => k.trim()),
    absoluteTitle: true,
  });
}

export default async function HomePage() {
  const { t, locale } = await getServerI18n();
  const [latestParts, workshops, catalogSession] = await Promise.all([
    getLatestSpareParts(6),
    getWorkshops(),
    getServiceCatalogSession(),
  ]);

  return (
    <>
      <SiteJsonLd locale={locale} description={t.meta.descriptions.home} />
      <HeroImageSlider slideAriaLabel={t.home.hero.slideAriaLabel} />

      <div className="hidden md:block">
        <ServicesCatalogSection variant="home" {...catalogSession} />
        <HomeSparePartsSection parts={latestParts} />
        <HomeCtaSection />
        <HomeLocationsSection workshops={workshops} />
      </div>
    </>
  );
}
