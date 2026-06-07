import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { HeroSection } from "@/components/home/hero-section";
import { HomeCtaSection } from "@/components/home/home-cta-section";
import { HomeLocationsSection } from "@/components/home/home-locations-section";
import { HomeSparePartsSection } from "@/components/home/home-spare-parts-section";
import { TrustMarquee } from "@/components/home/trust-marquee";
import { ServiceCard } from "@/components/services/service-card";
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

      <section className="mx-auto w-[90%] max-w-[1200px] py-16">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">{t.home.ourServices}</p>
            <h2 className="mt-2 text-3xl font-bold">{t.home.services.title}</h2>
          </div>
          <Link
            href="/services"
            className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex"
          >
            {t.common.viewAll}
            <ArrowLeft className="size-4" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.length > 0 ? (
            featured.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))
          ) : (
            <p className="col-span-full text-muted">{t.home.services.empty}</p>
          )}
        </div>
      </section>

      <HomeSparePartsSection parts={latestParts} />

      <HomeLocationsSection workshops={workshops} />

      <HomeCtaSection />
    </>
  );
}
