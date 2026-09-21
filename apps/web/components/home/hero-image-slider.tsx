"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { PublicHeroBanner } from "@/lib/hero-banners-shared";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 6000;

type HeroImageSliderProps = {
  banners: PublicHeroBanner[];
  slideAriaLabel: string;
};

export function HeroImageSlider({
  banners,
  slideAriaLabel,
}: HeroImageSliderProps) {
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
      className="hero-image-slider relative -mt-14 bg-site-main sm:-mt-20"
      aria-roledescription="carousel"
      aria-label={slideAriaLabel}
    >
      <div className="hero-image-slider__viewport">
        {banners.map((banner, index) => {
          const isActive = index === activeIndex;

          return (
            <Link
              key={banner.id}
              href={banner.href}
              className={cn(
                "hero-image-slider__slide",
                isActive
                  ? "hero-image-slider__slide--active"
                  : "hero-image-slider__slide--inactive",
              )}
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.src}
                alt=""
                aria-hidden
                className="hero-image-slider__backdrop"
                decoding="async"
                loading={index === 0 ? "eager" : "lazy"}
                draggable={false}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={banner.src}
                alt={isActive ? banner.alt : ""}
                className="hero-image-slider__img"
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
            className="hero-image-slider__indicators"
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
                  "hero-image-slider__dot",
                  index === activeIndex && "hero-image-slider__dot--active",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
