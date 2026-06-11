import Image from "next/image";
import Link from "next/link";
import { HeroMobileCarousel } from "@/components/home/hero-mobile-carousel";
import type { HeroSlide } from "@/components/home/hero-types";
import { LocaleForwardArrow } from "@/components/ui/locale-arrows";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type HeroSectionProps = {
  titleBefore: string;
  titleHighlight: string;
  subtitle: string;
  cta: string;
  ctaHref?: string;
  slides: readonly HeroSlide[];
  slideAriaLabel: string;
  locale: Locale;
};

function DesktopHeroContent({
  titleBefore,
  titleHighlight,
  subtitle,
  cta,
  ctaHref,
}: HeroSlide) {
  return (
    <div className="max-w-xl space-y-4 text-start">
      <h1 className="font-poppins text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
        {titleBefore}{" "}
        <span className="text-[#94D4B9]">{titleHighlight}</span>
      </h1>

      <p className="text-base leading-7 text-white/90 sm:text-lg">{subtitle}</p>

      <Link
        href={ctaHref}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-[20px] bg-[#94D4B9] px-8 text-sm font-semibold text-[#050B10] transition-opacity hover:opacity-90"
      >
        {cta}
        <LocaleForwardArrow />
      </Link>
    </div>
  );
}

export function HeroSection({
  titleBefore,
  titleHighlight,
  subtitle,
  cta,
  ctaHref = "/request",
  slides,
  slideAriaLabel,
  locale,
}: HeroSectionProps) {
  const isRtl = locale === "ar";
  const desktopSlide: HeroSlide = {
    titleBefore,
    titleHighlight,
    subtitle,
    cta,
    ctaHref,
  };

  return (
    <>
      <section className="relative flex min-h-[calc(100dvh-3.5rem-5.25rem-env(safe-area-inset-bottom))] w-full items-center overflow-hidden bg-[#050B10] md:hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <Image
            src="/hero-bg-mobile-car.png"
            alt=""
            fill
            priority
            fetchPriority="high"
            quality={75}
            sizes="100vw"
            className={cn(
              "hero-mobile-bg-drift object-cover",
              isRtl ? "object-left" : "object-right",
            )}
          />
          <div
            className={cn(
              "absolute inset-0",
              isRtl
                ? "bg-gradient-to-l from-[#050B10]/90 via-[#050B10]/40 to-transparent"
                : "bg-gradient-to-r from-[#050B10]/90 via-[#050B10]/40 to-transparent",
            )}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#050B10]/50 via-transparent to-[#050B10]/80"
            aria-hidden
          />
        </div>

        <div className="relative z-10 flex w-full items-center justify-center px-6 py-8">
          <HeroMobileCarousel
            slides={slides}
            slideAriaLabel={slideAriaLabel}
            locale={locale}
          />
        </div>
      </section>

      <section className="relative -mt-20 hidden min-h-[100svh] w-full overflow-hidden bg-[#050B10] pt-20 md:block">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/hero-bg.png"
            alt=""
            fill
            priority
            quality={80}
            sizes="100vw"
            className="object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#050B10]/60 via-transparent to-transparent"
            aria-hidden
          />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] w-[90%] max-w-[1200px] items-center py-20 sm:py-28 lg:py-24">
          <div className="animate-fade-up">
            <DesktopHeroContent {...desktopSlide} />
          </div>
        </div>
      </section>
    </>
  );
}
