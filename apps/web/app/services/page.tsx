import type { Metadata } from "next";
import { ServicesCtaSection } from "@/components/home/home-cta-section";
import { ServiceCard } from "@/components/services/service-card";
import { ServicesHeroSection } from "@/components/services/services-hero-section";
import { getServerI18n } from "@/lib/i18n/server";
import { getServices } from "@/lib/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.meta.services };
}

export default async function ServicesPage() {
  const { t } = await getServerI18n();
  const services = await getServices();

  return (
    <>
      <ServicesHeroSection />

      <section className="mx-auto w-[90%] max-w-[1200px] py-16">
        <div className="mb-10">
          <p className="text-sm font-semibold text-[#94D4B9]">{t.services.allServices}</p>
          <h2 className="mt-2 text-3xl font-bold">{t.services.chooseService}</h2>
          <p className="mt-3 max-w-2xl text-base leading-8 text-muted">
            {t.services.description}
          </p>
        </div>

        <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.length > 0 ? (
            services.map((service) => (
              <ServiceCard key={service.id} service={service} variant="grid" />
            ))
          ) : (
            <p className="col-span-full text-muted">{t.services.empty}</p>
          )}
        </div>
      </section>

      <ServicesCtaSection />
    </>
  );
}
