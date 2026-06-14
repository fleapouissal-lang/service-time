"use client";

import Link from "next/link";
import { LocaleForwardArrow } from "@/components/ui/locale-arrows";
import { useLocale } from "@/lib/i18n/locale-context";
import { useTheme } from "@/lib/theme/theme-context";
import { cn } from "@/lib/utils";

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
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <section className="cta-section px-[5%] py-16">
      <div
        className={cn(
          "cta-section__panel relative mx-auto flex min-h-[320px] w-[90%] max-w-[1220px] items-center overflow-hidden rounded-[20px] bg-cover sm:min-h-[360px]",
          isLight ? "bg-[center_right]" : "bg-center",
        )}
        style={{
          backgroundImage: `url('${isLight ? "/cta-bg-light.png" : "/cta-bg.png"}')`,
        }}
      >
        <div
          className="cta-section__overlay pointer-events-none absolute inset-0 z-[1]"
          aria-hidden
        />

        <div className="relative z-10 flex w-full flex-col items-start gap-6 px-6 py-14 text-start sm:px-10 sm:py-16">
          {title && (
            <h2 className="cta-section__title font-poppins text-2xl font-bold leading-tight sm:text-3xl">
              {title}
            </h2>
          )}

          <p className="cta-section__desc max-w-xl text-base leading-8 sm:text-lg">
            {description}
          </p>

          <Link
            href={ctaHref}
            className="cta-section__btn inline-flex h-12 items-center justify-center gap-2 rounded-[20px] px-8 text-sm font-semibold transition-opacity"
          >
            {ctaLabel}
            <LocaleForwardArrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HomeCtaSection() {
  const { messages: t } = useLocale();

  return (
    <CtaSection
      title={t.home.cta.title}
      description={t.home.cta.description}
      ctaLabel={t.home.cta.ctaLabel}
    />
  );
}

export function ServicesCtaSection() {
  const { messages: t } = useLocale();

  return (
    <CtaSection
      title={t.services.cta.title}
      description={t.services.cta.description}
      ctaLabel={t.services.cta.ctaLabel}
    />
  );
}

export function AboutCtaSection() {
  const { messages: t } = useLocale();

  return (
    <CtaSection
      title={t.about.cta.title}
      description={t.about.cta.description}
      ctaLabel={t.about.cta.ctaLabel}
    />
  );
}
