import type { Metadata } from "next";
import { ServicesCtaSection } from "@/components/home/home-cta-section";
import { ServiceCard } from "@/components/services/service-card";
import { ServicesHeroSection } from "@/components/services/services-hero-section";
import { getServerI18n } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/seo";
import { getServices } from "@/lib/queries";
import {
  sectionEyebrowClass,
  sectionTitleH2MdClass,
} from "@/lib/section-styles";

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
  const { t } = await getServerI18n();
  const services = await getServices();

  return (
    <>
      <div className="hidden md:block">
        <ServicesHeroSection />
      </div>

      <section className="mx-auto w-full max-w-[1200px] bg-site-main px-3 pb-8 pt-14 md:w-[90%] md:px-0 md:py-16">
        <div className="mb-6 md:mb-10">
          <p className={sectionEyebrowClass}>
            {t.services.allServices}
          </p>
          <h1 className={sectionTitleH2MdClass}>
            {t.services.chooseService}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted md:text-base">
            {t.services.description}
          </p>
        </div>

        <div className="grid grid-cols-2 items-stretch gap-3.5 sm:gap-5 lg:grid-cols-3">
          {services.length > 0 ? (
            services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                variant="grid"
              />
            ))
          ) : (
            <p className="col-span-full text-muted">{t.services.empty}</p>
          )}
        </div>
      </section>

      <div className="hidden md:block">
        <ServicesCtaSection />
      </div>
    </>
  );
}
