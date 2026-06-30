"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 6000;

type HeroBanner = {
  src: string;
  href: string;
  alt: string;
};

const BANNERS: HeroBanner[] = [
  {
    src: "/hero/hero-maintenance-dark.png",
    href: "/request?category=periodic_maintenance",
    alt: "صيانة اليوم… راحة لبكرة",
  },
  {
    src: "/hero/hero-towing-light.png",
    href: "/request?category=emergency",
    alt: "سطحتك بطلب واحد",
  },
  {
    src: "/hero/hero-roadside-dark.png",
    href: "/request?category=emergency",
    alt: "معك في كل مشوار",
  },
  {
    src: "/hero/hero-spareparts-dark.png",
    href: "/spare-parts",
    alt: "دورناها عنك",
  },
  {
    src: "/hero/hero-bodywork-light.png",
    href: "/request",
    alt: "لا تشيل هم الصدمة",
  },
];

type HeroImageSliderProps = {
  slideAriaLabel: string;
};

export function HeroImageSlider({ slideAriaLabel }: HeroImageSliderProps) {
  const banners = BANNERS;
  const [activeIndex, setActiveIndex] = useState(0);

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
      className="hero-image-slider bg-site-main"
      aria-roledescription="carousel"
      aria-label={slideAriaLabel}
    >
      <div className="hero-image-slider__viewport">
        {banners.map((banner, index) => {
          const isActive = index === activeIndex;

          return (
            <Link
              key={banner.src}
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
                key={banner.src}
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
