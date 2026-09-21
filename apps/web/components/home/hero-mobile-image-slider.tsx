"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PublicHeroBanner } from "@/lib/hero-banners-shared";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 6000;

type HeroMobileImageSliderProps = {
  banners: PublicHeroBanner[];
  slideAriaLabel: string;
};

export function HeroMobileImageSlider({
  banners,
  slideAriaLabel,
}: HeroMobileImageSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [banners]);

  const goToNext = useCallback(() => {
    setActiveIndex((current) =>
      banners.length > 0 ? (current + 1) % banners.length : 0,
    );
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

  if (banners.length === 0) return null;

  return (
    <section
      className="hero-mobile-image-slider"
      aria-roledescription="carousel"
      aria-label={slideAriaLabel}
    >
      <div className="hero-mobile-image-slider__viewport">
        {banners.map((banner, index) => {
          const isActive = index === activeIndex;

          return (
            <Link
              key={banner.id}
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
                src={banner.src}
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
                key={banner.id}
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
