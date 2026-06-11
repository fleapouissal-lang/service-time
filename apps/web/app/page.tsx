import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { HomeServicesSection } from "@/components/home/home-services-section";
import { HomeCtaSection } from "@/components/home/home-cta-section";
import { HomeLocationsSection } from "@/components/home/home-locations-section";
import { HomeSparePartsSection } from "@/components/home/home-spare-parts-section";
import { TrustMarquee } from "@/components/home/trust-marquee";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { resolveHeroContent } from "@/lib/hero-content";
import { getServerI18n } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/seo";
import { getLatestSpareParts, getServices, getSiteContent, getWorkshops } from "@/lib/queries";

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
  const [services, hero, latestParts, workshops] = await Promise.all([
    getServices(),
    getSiteContent("home.hero"),
    getLatestSpareParts(6),
    getWorkshops(),
  ]);

  const { titleBefore, titleHighlight, subtitle, cta } = resolveHeroContent(
    hero,
    locale,
    t,
  );

  const featured = services.slice(0, 6);

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
        <TrustMarquee />
        <HomeServicesSection services={featured} />
        <HomeSparePartsSection parts={latestParts} />
        <HomeLocationsSection workshops={workshops} />
        <HomeCtaSection />
      </div>
    </>
  );
}
