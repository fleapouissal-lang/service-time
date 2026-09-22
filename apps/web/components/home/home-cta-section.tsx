"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCtaSlideImage, type CtaSlideId } from "@/lib/cta-slides";
import type { PublicCtaBanner } from "@/lib/cta-banners-shared";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { useOptionalLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 6000;

function resolveFallbackLocale(): Locale {
  if (typeof document === "undefined") return "ar";
  return document.documentElement.lang === "en" ? "en" : "ar";
}

function buildFallbackSlides(locale: Locale): PublicCtaBanner[] {
  const slides = getDictionary(locale).siteCta.slides;
  return slides.map((slide) => ({
    id: slide.id,
    titleBefore: slide.titleBefore,
    titleHighlight: slide.titleHighlight,
    description: slide.description,
    ctaLabel: slide.ctaLabel,
    href: slide.ctaHref,
    imageSrc: getCtaSlideImage(slide.id as CtaSlideId),
  }));
}

type SiteCtaSectionProps = {
  /** Use when CTA sits inside a page section that already has site container width. */
  inset?: boolean;
  /** CMS slides from getPublicCtaBanners; falls back to i18n defaults. */
  slides?: PublicCtaBanner[];
};

export function SiteCtaSection({
  inset = false,
  slides: slidesProp,
}: SiteCtaSectionProps) {
  const localeContext = useOptionalLocale();
  const t = useMemo(
    () => localeContext?.messages ?? getDictionary(resolveFallbackLocale()),
    [localeContext?.messages],
  );
  const locale = localeContext?.locale ?? resolveFallbackLocale();
  const slides = useMemo(
    () =>
      slidesProp && slidesProp.length > 0
        ? slidesProp
        : buildFallbackSlides(locale),
    [slidesProp, locale],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const goToSlide = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const goToNextSlide = useCallback(() => {
    setActiveIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    setActiveIndex(0);
  }, [slides]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion || slides.length <= 1) return;

    const timer = window.setInterval(goToNextSlide, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [goToNextSlide, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section
      className={cn(
        "cta-section py-12 sm:py-16",
        inset ? "w-full" : "mx-auto w-[90%] max-w-[1200px]",
      )}
      aria-roledescription="carousel"
      aria-label={t.siteCta.slidesAriaLabel}
    >
      <div className="cta-slider relative w-full overflow-hidden rounded-[20px]">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;

          return (
            <div
              key={slide.id}
              className={cn(
                "cta-slider__slide",
                isActive
                  ? "cta-slider__slide--active"
                  : "cta-slider__slide--inactive",
              )}
              aria-hidden={!isActive}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.imageSrc}
                alt=""
                aria-hidden
                className="cta-slider__image"
                decoding="async"
                loading={index <= 1 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                draggable={false}
              />
              <div className="cta-slider__scrim" aria-hidden />
              <div className="cta-slider__content">
                <p className="cta-slider__title">
                  <span className="cta-slider__title-before">
                    {slide.titleBefore}
                  </span>{" "}
                  <span className="cta-slider__title-highlight">
                    {slide.titleHighlight}
                  </span>
                </p>
                <p className="cta-slider__desc">{slide.description}</p>
              </div>
              {slide.href ? (
                <Link
                  href={slide.href}
                  className="absolute inset-0 z-[3]"
                  aria-label={slide.ctaLabel || slide.titleBefore}
                  tabIndex={isActive ? 0 : -1}
                />
              ) : null}
            </div>
          );
        })}

        {slides.length > 1 ? (
          <div
            className="cta-slider__indicators pointer-events-auto absolute inset-x-0 bottom-3 z-[4] flex items-center justify-center gap-2"
            role="tablist"
            aria-label={t.siteCta.slidesAriaLabel}
          >
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`${t.siteCta.slideAriaLabel} ${index + 1}`}
                onClick={() => goToSlide(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === activeIndex
                    ? "w-7 bg-[#94D4B9]"
                    : "w-1.5 bg-white/35 hover:bg-white/55",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** @deprecated Use SiteCtaSection — kept for existing imports */
export const HomeCtaSection = SiteCtaSection;
export const ServicesCtaSection = SiteCtaSection;
export const AboutCtaSection = SiteCtaSection;
