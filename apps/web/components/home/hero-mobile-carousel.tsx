"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LocaleForwardArrow } from "@/components/ui/locale-arrows";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "@/components/home/hero-types";

const SLIDE_INTERVAL_MS = 6200;
const EXIT_MS = 550;

type SlideMotion = "idle" | "enter" | "exit";

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

type HeroMobileCarouselProps = {
  slides: readonly HeroSlide[];
  slideAriaLabel: string;
  locale: Locale;
};

export function HeroMobileCarousel({
  slides,
  slideAriaLabel,
  locale,
}: HeroMobileCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [motion, setMotion] = useState<SlideMotion>("enter");
  const exitTimerRef = useRef<number | null>(null);

  const goToNextSlide = useCallback(() => {
    setMotion("exit");

    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
    }

    exitTimerRef.current = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
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

  return (
    <>
      <MobileHeroSlide slide={mobileSlide} motion={motion} locale={locale} />
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {slideAriaLabel} {activeIndex + 1}
      </p>
    </>
  );
}
