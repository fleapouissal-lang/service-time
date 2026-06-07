import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type CtaSectionProps = {
  title?: string;
  description: string;
  ctaLabel: string;
  ctaHref?: string;
};

export function CtaSection({
  title,
  description,
  ctaLabel,
  ctaHref = "/request",
}: CtaSectionProps) {
  return (
    <section className="bg-[#060709] px-[5%] py-16">
      <div
        className="relative mx-auto flex min-h-[320px] w-[90%] max-w-[1220px] items-center overflow-hidden rounded-[20px] border border-[#94D4B9]/10 bg-[#050B10] bg-cover bg-center shadow-[0_4px_24px_rgba(148,212,185,0.06)] sm:min-h-[360px]"
        style={{ backgroundImage: "url('/cta-bg.png')" }}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-black/92"
          aria-hidden
        />

        <div className="relative z-10 flex w-full flex-col items-start gap-6 px-6 py-14 text-start sm:px-10 sm:py-16">
          {title && (
            <h2 className="font-poppins text-2xl font-bold leading-tight text-white sm:text-3xl">
              {title}
            </h2>
          )}

          <p className="max-w-xl text-base leading-8 text-white/90 sm:text-lg">
            {description}
          </p>

          <Link
            href={ctaHref}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[20px] bg-[#94D4B9] px-8 text-sm font-semibold text-[#050B10] transition-opacity hover:opacity-90"
          >
            {ctaLabel}
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomeCtaSection() {
  return (
    <CtaSection
      title="جاهز لطلب الخدمة؟"
      description="املأ النموذج وسنتواصل معك عبر واتساب أو SMS مع رابط تتبع مباشر لحالة طلبك."
      ctaLabel="ابدأ طلب الخدمة"
    />
  );
}

export function ServicesCtaSection() {
  return (
    <CtaSection
      title="تحتاج خدمة مخصصة؟"
      description="لم تجد الخدمة المناسبة؟ أرسل طلبك وسيتواصل فريق Service Time معك لتحديد الحل الأنسب لسيارتك — صيانة، طوارئ، أو قطع غيار."
      ctaLabel="طلب خدمة الآن"
    />
  );
}

export function AboutCtaSection() {
  return (
    <CtaSection
      title="جاهز لتجربة Service Time؟"
      description="اطلب خدمتك الآن وتابع حالة طلبك خطوة بخطوة — صيانة، طوارئ، أو قطع غيار مع فريق يهتم بسيارتك."
      ctaLabel="ابدأ طلب الخدمة"
    />
  );
}
