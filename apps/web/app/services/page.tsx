import type { Metadata } from "next";
import { ServicesCtaSection } from "@/components/home/home-cta-section";
import { ServicesCatalogSection } from "@/components/services/services-catalog-section";
import { ServicesHeroSection } from "@/components/services/services-hero-section";
import { getServerI18n } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/seo";
import { getServiceCatalogSession } from "@/lib/services-catalog-session";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildPageMetadata({
    title: t.meta.services,
    description: t.meta.descriptions.services,
    pathname: "/services",
    locale,
  });
}

export default async function ServicesPage() {
  const catalogSession = await getServiceCatalogSession();

  return (
    <>
      <div className="hidden md:block">
        <ServicesHeroSection />
      </div>

      <ServicesCatalogSection variant="page" {...catalogSession} />

      <div className="hidden md:block">
        <ServicesCtaSection />
      </div>
    </>
  );
}
