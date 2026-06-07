import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { ContactInfoCard } from "@/components/contact/contact-info-card";
import { getSiteContent, getWorkshops } from "@/lib/queries";

export const metadata: Metadata = {
  title: "تواصل معنا",
};

function phoneTelHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export default async function ContactPage() {
  const [phone, email, workshops] = await Promise.all([
    getSiteContent("contact.phone"),
    getSiteContent("contact.email"),
    getWorkshops(),
  ]);

  const phoneValue = (phone?.value as string) ?? "+966500000001";
  const emailValue = (email?.value as string) ?? "info@servicetime.sa";

  const mainBranch = workshops[0];
  const locationLabel =
    mainBranch?.address_ar ??
    mainBranch?.name_ar ??
    "الرياض، المملكة العربية السعودية";
  const mapLat = mainBranch?.lat ?? 24.7136;
  const mapLng = mainBranch?.lng ?? 46.6753;
  const mapsHref = `https://www.google.com/maps/dir/?api=1&destination=${mapLat},${mapLng}`;

  return (
    <section className="mx-auto w-[90%] max-w-[1200px] pb-12 pt-28 sm:pt-32">
      <div className="grid gap-6 lg:grid-cols-2 lg:grid-rows-[auto_auto] lg:items-stretch lg:gap-x-8 lg:gap-y-6">
        <div className="order-1 text-start lg:col-start-1 lg:row-start-1">
          <p className="text-sm font-semibold text-[#94D4B9]">تواصل</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
            نحن هنا لمساعدتك
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted sm:text-base">
            تواصل مع فريق Service Time للاستفسارات أو متابعة طلبك.
          </p>
        </div>

        <div className="order-3 text-start lg:col-start-2 lg:row-start-1">
          <p className="text-sm font-semibold text-[#94D4B9]">رسالة سريعة</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">أرسل لنا رسالة</h2>
          <p className="mt-2 text-sm leading-7 text-muted sm:text-base">
            املأ النموذج وسنعود إليك عبر الهاتف أو البريد الإلكتروني.
          </p>
        </div>

        <div className="order-4 self-stretch lg:col-start-2 lg:row-start-2">
          <ContactForm />
        </div>

        <div className="order-2 flex flex-col gap-5 self-stretch lg:col-start-1 lg:row-start-2 lg:h-full lg:min-h-0">
          <ContactInfoCard
            href={phoneTelHref(phoneValue)}
            icon={Phone}
            title="الهاتف"
            value={phoneValue}
            valueDir="ltr"
            className="lg:min-h-0 lg:flex-1 lg:items-center"
          />
          <ContactInfoCard
            href={`mailto:${emailValue}`}
            icon={Mail}
            title="البريد الإلكتروني"
            value={emailValue}
            valueDir="ltr"
            className="lg:min-h-0 lg:flex-1 lg:items-center"
          />
          <ContactInfoCard
            href={mapsHref}
            icon={MapPin}
            title="الموقع"
            value={locationLabel}
            external
            className="lg:min-h-0 lg:flex-1 lg:items-center"
          />
        </div>
      </div>
    </section>
  );
}
