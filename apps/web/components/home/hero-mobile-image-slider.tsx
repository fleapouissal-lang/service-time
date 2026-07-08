"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AR_MOBILE_BANNERS,
  EN_MOBILE_BANNERS,
  HERO_MOBILE_IMAGE_VERSION,
} from "@/lib/hero-mobile-banners";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 6000;

type HeroMobileImageSliderProps = {
  slideAriaLabel: string;
};

export function HeroMobileImageSlider({
  slideAriaLabel,
}: HeroMobileImageSliderProps) {
  const { locale } = useLocale();
  const banners = locale === "en" ? EN_MOBILE_BANNERS : AR_MOBILE_BANNERS;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [locale]);

  const goToNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(goToNext, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [goToNext, banners.length]);

  return (
    <section
      className="hero-mobile-image-slider"
      aria-roledescription="carousel"
      aria-label={slideAriaLabel}
    >
      <div className="hero-mobile-image-slider__viewport">
        {banners.map((banner, index) => {
          const isActive = index === activeIndex;
          const imageSrc = `${banner.src}?v=${HERO_MOBILE_IMAGE_VERSION}`;

          return (
            <Link
              key={banner.src}
              href={banner.href}
              className={cn(
                "hero-mobile-image-slider__slide",
                isActive
                  ? "hero-mobile-image-slider__slide--active"
                  : "hero-mobile-image-slider__slide--inactive",
              )}
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={isActive ? banner.alt : ""}
                className="hero-mobile-image-slider__img"
                decoding="async"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                draggable={false}
              />
            </Link>
          );
        })}

        {banners.length > 1 ? (
          <div
            className="hero-mobile-image-slider__indicators"
            role="tablist"
            aria-label={slideAriaLabel}
          >
            {banners.map((banner, index) => (
              <button
                key={banner.src}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`${slideAriaLabel} ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "hero-mobile-image-slider__dot",
                  index === activeIndex &&
                    "hero-mobile-image-slider__dot--active",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
