"use client";

import { useCallback, useEffect, useState } from "react";
import {
  HERO_AR_DARK_SLIDES,
  type HeroArDarkSlide,
} from "@/lib/hero-ar-dark-slides";
import { useTheme } from "@/lib/theme/theme-context";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 5000;

type HeroArDarkSliderProps = {
  slidesAriaLabel: string;
  slideAriaLabel: string;
  variant: "mobile" | "desktop";
  className?: string;
};

function HeroSlideLayers({
  slide,
  isActive,
  priority,
}: {
  slide: HeroArDarkSlide;
  isActive: boolean;
  priority: boolean;
}) {
  const visibility = isActive
    ? "hero-ar-dark-slider__layer--active"
    : "hero-ar-dark-slider__layer--inactive";

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slide.src}
        alt=""
        aria-hidden
        width={slide.width}
        height={slide.height}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        draggable={false}
        className={cn("hero-ar-dark-slider__backdrop", visibility)}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slide.src}
        alt={isActive ? slide.alt : ""}
        width={slide.width}
        height={slide.height}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        draggable={false}
        className={cn("hero-ar-dark-slider__foreground", visibility)}
      />
      <div className={cn("hero-ar-dark-slider__veil", visibility)} aria-hidden />
    </>
  );
}

export function HeroArDarkSlider({
  slidesAriaLabel,
  slideAriaLabel,
  variant,
  className,
}: HeroArDarkSliderProps) {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  const goToSlide = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const goToNextSlide = useCallback(() => {
    setActiveIndex((current) => (current + 1) % HERO_AR_DARK_SLIDES.length);
  }, []);

  useEffect(() => {
    if (theme !== "dark") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const timer = window.setInterval(goToNextSlide, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [goToNextSlide, theme]);

  if (theme !== "dark") {
    return null;
  }

  return (
    <div
      className={cn(
        "hero-ar-dark-slider",
        variant === "desktop"
          ? "hero-ar-dark-slider--desktop"
          : "hero-ar-dark-slider--mobile",
        className,
      )}
      aria-roledescription="carousel"
      aria-label={slidesAriaLabel}
    >
      {HERO_AR_DARK_SLIDES.map((slide, index) => (
        <div
          key={slide.src}
          className={cn(
            "hero-ar-dark-slider__slide absolute inset-0",
            index === activeIndex ? "z-[2]" : "z-[1]",
          )}
          aria-hidden={index !== activeIndex}
        >
          <HeroSlideLayers
            slide={slide}
            isActive={index === activeIndex}
            priority={index <= 1}
          />
        </div>
      ))}

      <div
        className={cn(
          "hero-ar-dark-slider__indicators pointer-events-auto absolute inset-x-0 z-[4] flex items-center justify-center gap-2",
          variant === "desktop"
            ? "hero-ar-dark-slider__indicators--desktop"
            : "bottom-3",
        )}
        role="tablist"
        aria-label={slidesAriaLabel}
      >
        {HERO_AR_DARK_SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`${slideAriaLabel} ${index + 1}`}
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
    </div>
  );
}
