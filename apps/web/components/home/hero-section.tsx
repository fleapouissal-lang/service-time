import Link from "next/link";
import { HeroArDarkSlider } from "@/components/home/hero-ar-dark-slider";
import { HeroArLightOnly } from "@/components/home/hero-ar-light-only";
import { HeroBrandsBar } from "@/components/home/hero-brands-bar";
import { HeroDesktopBackground } from "@/components/home/hero-desktop-background";
import { HeroMobileBackground } from "@/components/home/hero-mobile-background";
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
  slidesAriaLabel: string;
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
      <h1 className="hero-desktop__title font-poppins text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[3.25rem]">
        {titleBefore}{" "}
        <span className="hero-desktop__highlight">{titleHighlight}</span>
      </h1>

      <p className="hero-desktop__subtitle text-base leading-7 sm:text-lg">{subtitle}</p>

      <Link
        href={ctaHref}
        className="hero-desktop__cta inline-flex h-12 items-center justify-center gap-2 rounded-[20px] px-8 text-sm font-semibold transition-opacity hover:opacity-90"
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
  slidesAriaLabel,
  locale,
}: HeroSectionProps) {
  const isRtl = locale === "ar";
  const isArabic = locale === "ar";
  const desktopSlide: HeroSlide = {
    titleBefore,
    titleHighlight,
    subtitle,
    cta,
    ctaHref,
  };

  return (
    <>
      <section
        className={cn(
          "hero-mobile relative flex w-full overflow-hidden bg-site-main md:hidden",
          isArabic
            ? "hero-mobile--ar-dark -mt-14 min-h-[calc(100dvh-3.5rem-5.25rem-env(safe-area-inset-bottom))] pt-14"
            : "min-h-[calc(100dvh-3.5rem-5.25rem-env(safe-area-inset-bottom))]",
        )}
      >
        {isArabic ? (
          <HeroArDarkSlider
            variant="mobile"
            slidesAriaLabel={slidesAriaLabel}
            slideAriaLabel={slideAriaLabel}
          />
        ) : null}

        <HeroArLightOnly locale={locale}>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <HeroMobileBackground isRtl={isRtl} />
            <div
              className={cn(
                "hero-mobile__overlay-side absolute inset-0",
                isRtl
                  ? "hero-mobile__overlay-side--rtl"
                  : "hero-mobile__overlay-side--ltr",
              )}
              aria-hidden
            />
            <div
              className="hero-mobile__overlay-bottom absolute inset-0"
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
        </HeroArLightOnly>
      </section>

      <section
        className={cn(
          "hero-desktop relative -mt-20 hidden w-full overflow-hidden bg-site-main pt-20 md:block",
          isArabic
            ? "hero-desktop--ar-dark h-[100svh] min-h-[100svh] max-h-[100svh]"
            : "min-h-[100svh]",
        )}
      >
        {isArabic ? (
          <HeroArDarkSlider
            variant="desktop"
            slidesAriaLabel={slidesAriaLabel}
            slideAriaLabel={slideAriaLabel}
          />
        ) : null}

        <HeroArLightOnly locale={locale}>
          <div className="pointer-events-none absolute inset-0">
            <HeroDesktopBackground />
            <div
              className={cn(
                "hero-desktop__overlay absolute inset-0",
                isRtl
                  ? "hero-desktop__overlay--rtl"
                  : "hero-desktop__overlay--ltr",
              )}
              aria-hidden
            />
          </div>

          <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] w-[90%] max-w-[1200px] items-center py-20 sm:py-28 lg:py-24">
            <div className="animate-fade-up">
              <DesktopHeroContent {...desktopSlide} />
            </div>
          </div>
        </HeroArLightOnly>

        <HeroBrandsBar />
      </section>
    </>
  );
}
