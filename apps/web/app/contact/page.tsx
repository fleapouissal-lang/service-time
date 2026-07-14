import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { SiteCtaSection } from "@/components/home/home-cta-section";
import { ContactInfoCard } from "@/components/contact/contact-info-card";
import { ContactInfoMobileStrip } from "@/components/contact/contact-info-mobile-strip";
import { getServerI18n } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/seo";
import { getWorkshopAddress, getWorkshopName } from "@/lib/localized-content";
import { getSiteContent, getWorkshops } from "@/lib/queries";
import {
  sectionEyebrowClass,
  sectionTitleH2MdClass,
} from "@/lib/section-styles";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildPageMetadata({
    title: t.meta.contact,
    description: t.meta.descriptions.contact,
    pathname: "/contact",
    locale,
  });
}

function phoneTelHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export default async function ContactPage() {
  const { t, locale } = await getServerI18n();
  const [phone, email, workshops] = await Promise.all([
    getSiteContent("contact.phone"),
    getSiteContent("contact.email"),
    getWorkshops(),
  ]);

  const phoneValue = (phone?.value as string) ?? "+966 58 381 4214";
  const emailValue = (email?.value as string) ?? "servicetime10@gmail.com";

  const mainBranch = workshops[0];
  const locationLabel =
    (mainBranch
      ? getWorkshopAddress(mainBranch, locale) ||
        getWorkshopName(mainBranch, locale)
      : null) ?? t.footer.location;
  const mapLat = mainBranch?.lat ?? 24.7136;
  const mapLng = mainBranch?.lng ?? 46.6753;
  const mapsHref = `https://www.google.com/maps/dir/?api=1&destination=${mapLat},${mapLng}`;

  const contactItems = [
    {
      href: phoneTelHref(phoneValue),
      kind: "phone" as const,
      title: t.contact.phone,
      value: phoneValue,
      valueDir: "ltr" as const,
    },
    {
      href: `mailto:${emailValue}`,
      kind: "email" as const,
      title: t.contact.email,
      value: emailValue,
      valueDir: "ltr" as const,
    },
    {
      href: mapsHref,
      kind: "location" as const,
      title: t.contact.location,
      value: locationLabel,
      external: true,
    },
  ];

  return (
    <section
      className={cn(
        "mx-auto w-[90%] max-w-[1200px] pb-12 pt-14 max-md:px-4 md:pt-28 lg:pt-32",
      )}
    >
      <div className="grid gap-6 lg:grid-cols-2 lg:grid-rows-[auto_auto] lg:items-stretch lg:gap-x-8 lg:gap-y-6">
        <div className="order-1 hidden text-start md:block lg:col-start-1 lg:row-start-1">
          <p className={sectionEyebrowClass}>{t.contact.quickMessage}</p>
          <h2 className={sectionTitleH2MdClass}>{t.contact.sendMessage}</h2>
          <p className="mt-2 text-sm leading-7 text-muted sm:text-base">
            {t.contact.formHint}
          </p>
        </div>

        <div className="order-3 hidden text-start md:block lg:col-start-2 lg:row-start-1">
          <p className={sectionEyebrowClass}>{t.contact.eyebrow}</p>
          <h1 className={sectionTitleH2MdClass}>{t.contact.title}</h1>
          <p className="mt-2 text-sm leading-7 text-muted sm:text-base">
            {t.contact.description}
          </p>
        </div>

        <div className="order-2 self-stretch max-md:order-1 lg:col-start-1 lg:row-start-2">
          <ContactForm />
        </div>

        <div className="order-4 flex flex-col gap-5 self-stretch max-md:order-2 max-md:gap-3 lg:col-start-2 lg:row-start-2 lg:h-full lg:min-h-0">
          <ContactInfoMobileStrip items={contactItems} />

          <div className="hidden flex-col gap-5 md:flex lg:min-h-0 lg:h-full">
            <ContactInfoCard
              href={phoneTelHref(phoneValue)}
              icon={Phone}
              title={t.contact.phone}
              value={phoneValue}
              valueDir="ltr"
              className="lg:min-h-0 lg:flex-1 lg:items-center"
            />
            <ContactInfoCard
              href={`mailto:${emailValue}`}
              icon={Mail}
              title={t.contact.email}
              value={emailValue}
              valueDir="ltr"
              className="lg:min-h-0 lg:flex-1 lg:items-center"
            />
            <ContactInfoCard
              href={mapsHref}
              icon={MapPin}
              title={t.contact.location}
              value={locationLabel}
              external
              className="lg:min-h-0 lg:flex-1 lg:items-center"
            />
          </div>
        </div>
      </div>

      <SiteCtaSection inset />
    </section>
  );
}
