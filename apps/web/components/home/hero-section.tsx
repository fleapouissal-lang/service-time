"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LocaleForwardArrow } from "@/components/ui/locale-arrows";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 6200;
const EXIT_MS = 550;

export type HeroSlide = {
  titleBefore: string;
  titleHighlight: string;
  subtitle: string;
  cta: string;
  ctaHref: string;
};

type HeroSectionProps = {
  titleBefore: string;
  titleHighlight: string;
  subtitle: string;
  cta: string;
  ctaHref?: string;
};

type SlideMotion = "idle" | "enter" | "exit";

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

function MobileHeroSlide({
  slide,
  motion,
  locale,
}: {
  slide: HeroSlide;
  motion: SlideMotion;
  locale: Locale;
}) {
  const isRtl = locale === "ar";

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      lang={locale}
      className={cn(
        "flex w-[min(100%,22rem)] shrink-0 flex-col items-center space-y-5 text-center",
        motion === "exit" && "hero-mobile-slide-out",
        motion === "enter" && "hero-mobile-slide-in",
      )}
    >
      <h1
        className={cn(
          "hero-mobile-line-1 w-full text-[1.85rem] font-bold leading-snug tracking-tight text-white",
          isRtl ? "[font-family:var(--font-body)]" : "font-poppins",
        )}
      >
        {slide.titleBefore}{" "}
        <span className="hero-mobile-highlight text-[#94D4B9]">
          {slide.titleHighlight}
        </span>
      </h1>

      <p
        className={cn(
          "hero-mobile-line-2 w-full text-sm leading-relaxed text-white/88",
          isRtl && "[font-family:var(--font-body)]",
        )}
      >
        {slide.subtitle}
      </p>

      <Link
        href={slide.ctaHref}
        className="hero-mobile-line-3 inline-flex h-12 items-center justify-center gap-2 rounded-[20px] bg-[#94D4B9] px-8 text-sm font-semibold text-[#050B10] shadow-[0_8px_32px_rgba(148,212,185,0.28)] transition-opacity hover:opacity-90"
      >
        {slide.cta}
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
}: HeroSectionProps) {
  const { messages, locale } = useLocale();
  const slides = messages.home.hero.slides;
  const [activeIndex, setActiveIndex] = useState(0);
  const [motion, setMotion] = useState<SlideMotion>("enter");
  const [bgKey, setBgKey] = useState(0);
  const exitTimerRef = useRef<number | null>(null);

  const desktopSlide: HeroSlide = {
    titleBefore,
    titleHighlight,
    subtitle,
    cta,
    ctaHref,
  };

  const goToNextSlide = useCallback(() => {
    setMotion("exit");

    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
    }

    exitTimerRef.current = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
      setBgKey((key) => key + 1);
      setMotion("enter");

      window.setTimeout(() => {
        setMotion("idle");
      }, 980);

      exitTimerRef.current = null;
    }, EXIT_MS);
  }, [slides.length]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      setMotion("idle");
      return;
    }

    const timer = window.setInterval(goToNextSlide, SLIDE_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, [goToNextSlide]);

  useEffect(() => {
    setMotion("enter");
    const timer = window.setTimeout(() => setMotion("idle"), 980);
    return () => window.clearTimeout(timer);
  }, []);

  const mobileSlide = slides[activeIndex];
  const isRtl = locale === "ar";

  return (
    <>
      {/* Mobile — plein écran, texte centré */}
      <section className="relative flex min-h-[calc(100dvh-3.5rem-5.25rem-env(safe-area-inset-bottom))] w-full items-center overflow-hidden bg-[#050B10] md:hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <Image
            key={`${bgKey}-${locale}`}
            src="/hero-bg-mobile-car.png"
            alt=""
            fill
            priority
            unoptimized
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
          <MobileHeroSlide slide={mobileSlide} motion={motion} locale={locale} />
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {messages.home.hero.slideAriaLabel} {activeIndex + 1}
          </p>
        </div>
      </section>

      {/* Desktop — hero CMS statique */}
      <section className="relative -mt-20 hidden min-h-[100svh] w-full overflow-hidden bg-[#050B10] pt-20 md:block">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/hero-bg.png"
            alt=""
            fill
            priority
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
