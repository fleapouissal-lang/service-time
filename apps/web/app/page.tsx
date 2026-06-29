import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { ServicesCatalogSection } from "@/components/services/services-catalog-section";
import { HomeCtaSection } from "@/components/home/home-cta-section";
import { HomeLocationsSection } from "@/components/home/home-locations-section";
import { HomeSparePartsSection } from "@/components/home/home-spare-parts-section";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { resolveHeroContent } from "@/lib/hero-content";
import { getServerI18n } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/seo";
import { getLatestSpareParts, getSiteContent, getWorkshops } from "@/lib/queries";
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
  const [hero, latestParts, workshops, catalogSession] = await Promise.all([
    getSiteContent("home.hero"),
    getLatestSpareParts(6),
    getWorkshops(),
    getServiceCatalogSession(),
  ]);

  const { titleBefore, titleHighlight, subtitle, cta } = resolveHeroContent(
    hero,
    locale,
    t,
  );

  return (
    <>
      <SiteJsonLd locale={locale} description={t.meta.descriptions.home} />
      <HeroSection
        titleBefore={titleBefore}
        titleHighlight={titleHighlight}
        subtitle={subtitle}
        cta={cta}
        ctaHref="/request"
        slides={t.home.hero.slides}
        slideAriaLabel={t.home.hero.slideAriaLabel}
        locale={locale}
      />

      <div className="hidden md:block">
        <ServicesCatalogSection variant="home" {...catalogSession} />
        <HomeSparePartsSection parts={latestParts} />
        <HomeCtaSection />
        <HomeLocationsSection workshops={workshops} />
      </div>
    </>
  );
}
