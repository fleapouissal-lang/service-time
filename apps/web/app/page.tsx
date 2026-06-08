import { HeroSection } from "@/components/home/hero-section";
import { HomeServicesSection } from "@/components/home/home-services-section";
import { HomeCtaSection } from "@/components/home/home-cta-section";
import { HomeLocationsSection } from "@/components/home/home-locations-section";
import { HomeSparePartsSection } from "@/components/home/home-spare-parts-section";
import { TrustMarquee } from "@/components/home/trust-marquee";
import { resolveHeroContent } from "@/lib/hero-content";
import { getServerI18n } from "@/lib/i18n/server";
import { getLatestSpareParts, getServices, getSiteContent, getWorkshops } from "@/lib/queries";

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
      <HeroSection
        titleBefore={titleBefore}
        titleHighlight={titleHighlight}
        subtitle={subtitle}
        cta={cta}
        ctaHref="/request"
      />

      <TrustMarquee />

      <HomeServicesSection services={featured} />

      <HomeSparePartsSection parts={latestParts} />

      <HomeLocationsSection workshops={workshops} />

      <HomeCtaSection />
    </>
  );
}
