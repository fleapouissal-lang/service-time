import type { Metadata } from "next";
import { ServicesCtaSection } from "@/components/home/home-cta-section";
import { ServiceCard } from "@/components/services/service-card";
import { ServicesHeroSection } from "@/components/services/services-hero-section";
import { getServerI18n } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/seo";
import { getServices } from "@/lib/queries";
import { cn } from "@/lib/utils";

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
  const fitMobileViewport = services.length > 0 && services.length <= 6;

  return (
    <>
      <div className="hidden md:block">
        <ServicesHeroSection />
      </div>

      <section
        className={cn(
          "mx-auto w-full max-w-[1200px] px-4 md:w-[90%] md:px-0 md:py-16",
          fitMobileViewport
            ? "flex max-md:h-[calc(100dvh-3.5rem-5.25rem-env(safe-area-inset-bottom))] max-md:flex-col max-md:overflow-hidden max-md:px-3 max-md:pb-1 max-md:pt-14"
            : "pb-8 pt-20",
        )}
      >
        <div className="mb-10 hidden md:block">
          <p className="text-sm font-semibold text-[#94D4B9]">{t.services.allServices}</p>
          <h2 className="mt-2 text-3xl font-bold">{t.services.chooseService}</h2>
          <p className="mt-3 max-w-2xl text-base leading-8 text-muted">
            {t.services.description}
          </p>
        </div>

        <div
          className={cn(
            "grid grid-cols-2 items-stretch gap-3.5 sm:gap-5 lg:grid-cols-3",
            fitMobileViewport &&
              "max-md:min-h-0 max-md:flex-1 max-md:grid-rows-3 max-md:gap-2",
          )}
        >
          {services.length > 0 ? (
            services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                variant="grid"
                fitViewport={fitMobileViewport}
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
