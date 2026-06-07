"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

const INTERVAL_MS = 5000;

export function ServicesHeroSection() {
  const { messages: t } = useLocale();
  const slides = t.services.hero.slides;
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setVisible(false);

      window.setTimeout(() => {
        setActiveIndex((current) => (current + 1) % slides.length);
        setVisible(true);
      }, 280);
    }, INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const slide = slides[activeIndex];

  return (
    <section className="mx-auto w-[90%] max-w-[1200px] py-16 pt-28 sm:pt-32">
      <div className="max-w-2xl space-y-5 text-start">
        <p className="text-sm font-semibold text-[#94D4B9]">{t.services.hero.eyebrow}</p>

        <div
          className={cn(
            "space-y-4 transition-all duration-300 ease-out",
            visible
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0",
          )}
        >
          <h1 className="font-poppins text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            {slide.title}{" "}
            <span className="text-[#94D4B9]">{slide.highlight}</span>
          </h1>
          <p className="text-base leading-7 text-muted sm:text-lg">
            {slide.description}
          </p>
        </div>

        <div
          className="flex items-center gap-2"
          role="tablist"
          aria-label={t.services.hero.slidesAriaLabel}
        >
          {slides.map((item, index) => (
            <button
              key={item.title}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`${t.services.hero.slideAriaLabel} ${index + 1}`}
              onClick={() => {
                setVisible(false);
                window.setTimeout(() => {
                  setActiveIndex(index);
                  setVisible(true);
                }, 180);
              }}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === activeIndex
                  ? "w-8 bg-[#94D4B9]"
                  : "w-2 bg-[#94D4B9]/30 hover:bg-[#94D4B9]/50",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
