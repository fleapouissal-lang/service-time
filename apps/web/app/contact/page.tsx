import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { ContactInfoCard } from "@/components/contact/contact-info-card";
import { getServerI18n } from "@/lib/i18n/server";
import { getWorkshopAddress, getWorkshopName } from "@/lib/localized-content";
import { getSiteContent, getWorkshops } from "@/lib/queries";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.meta.contact };
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

  const phoneValue = (phone?.value as string) ?? "+966500000001";
  const emailValue = (email?.value as string) ?? "info@servicetime.sa";

  const mainBranch = workshops[0];
  const locationLabel =
    (mainBranch
      ? getWorkshopAddress(mainBranch, locale) ||
        getWorkshopName(mainBranch, locale)
      : null) ?? t.footer.location;
  const mapLat = mainBranch?.lat ?? 24.7136;
  const mapLng = mainBranch?.lng ?? 46.6753;
  const mapsHref = `https://www.google.com/maps/dir/?api=1&destination=${mapLat},${mapLng}`;

  return (
    <section className="mx-auto w-[90%] max-w-[1200px] pb-12 pt-28 sm:pt-32">
      <div className="grid gap-6 lg:grid-cols-2 lg:grid-rows-[auto_auto] lg:items-stretch lg:gap-x-8 lg:gap-y-6">
        <div className="order-1 text-start lg:col-start-1 lg:row-start-1">
          <p className="text-sm font-semibold text-[#94D4B9]">{t.contact.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{t.contact.title}</h1>
          <p className="mt-2 text-sm leading-7 text-muted sm:text-base">
            {t.contact.description}
          </p>
        </div>

        <div className="order-3 text-start lg:col-start-2 lg:row-start-1">
          <p className="text-sm font-semibold text-[#94D4B9]">{t.contact.quickMessage}</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{t.contact.sendMessage}</h2>
          <p className="mt-2 text-sm leading-7 text-muted sm:text-base">
            {t.contact.formHint}
          </p>
        </div>

        <div className="order-4 self-stretch lg:col-start-2 lg:row-start-2">
          <ContactForm />
        </div>

        <div className="order-2 flex flex-col gap-5 self-stretch lg:col-start-1 lg:row-start-2 lg:h-full lg:min-h-0">
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
    </section>
  );
}
