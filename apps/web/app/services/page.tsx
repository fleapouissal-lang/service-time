import type { Metadata } from "next";
import { ServicesCtaSection } from "@/components/home/home-cta-section";
import { ServiceCard } from "@/components/services/service-card";
import { ServicesHeroSection } from "@/components/services/services-hero-section";
import { getServices } from "@/lib/queries";

export const metadata: Metadata = {
  title: "الخدمات",
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <ServicesHeroSection />

      <section className="mx-auto w-[90%] max-w-[1200px] py-16">
        <div className="mb-10">
          <p className="text-sm font-semibold text-[#94D4B9]">جميع الخدمات</p>
          <h2 className="mt-2 text-3xl font-bold">اختر الخدمة المناسبة</h2>
          <p className="mt-3 max-w-2xl text-base leading-8 text-muted">
            صيانة دورية، طوارئ على الطريق، وطلب قطع غيار — مرّر على البطاقة
            واضغط «ابدأ طلب الخدمة» للمتابعة.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.length > 0 ? (
            services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))
          ) : (
            <p className="col-span-full text-muted">
              لا توجد خدمات متاحة حالياً — قم بتشغيل seed.sql
            </p>
          )}
        </div>
      </section>

      <ServicesCtaSection />
    </>
  );
}
