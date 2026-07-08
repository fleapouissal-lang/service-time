import Link from "next/link";
import { HeroBrandsBar } from "@/components/home/hero-brands-bar";
import { HeroDesktopBackground } from "@/components/home/hero-desktop-background";
import { HeroMobileImageSlider } from "@/components/home/hero-mobile-image-slider";
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
  /** Render only the full-screen mobile hero (desktop uses a different hero). */
  mobileOnly?: boolean;
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
  locale,
  mobileOnly = false,
}: HeroSectionProps) {
  const isRtl = locale === "ar";
  const desktopSlide: HeroSlide = {
    titleBefore,
    titleHighlight,
    subtitle,
    cta,
    ctaHref,
  };

  const mobileHero = (
    <div className="md:hidden">
      <HeroMobileImageSlider slideAriaLabel={slideAriaLabel} />
    </div>
  );

  if (mobileOnly) {
    return mobileHero;
  }

  return (
    <>
      {mobileHero}

      <section className="hero-desktop relative -mt-20 hidden min-h-[100svh] w-full overflow-hidden bg-site-main pt-20 md:block">
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

        <HeroBrandsBar />
      </section>
    </>
  );
}
