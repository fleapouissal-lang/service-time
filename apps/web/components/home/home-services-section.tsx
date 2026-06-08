"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import type { Service } from "@service-time/types";
import { ServiceCard } from "@/components/services/service-card";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

const AUTO_INTERVAL_MS = 5000;

const arrowClass = cn(
  "inline-flex size-8 shrink-0 items-center justify-center self-center rounded-full bg-[#94D4B9] text-[#050B10]",
  "shadow-[0_0_14px_rgba(148,212,185,0.35)] transition-all duration-300",
  "hover:scale-105 hover:shadow-[0_0_18px_rgba(148,212,185,0.5)] active:scale-95",
  "disabled:pointer-events-none disabled:opacity-40",
);

type HomeServicesSectionProps = {
  services: Service[];
};

export function HomeServicesSection({ services }: HomeServicesSectionProps) {
  const { messages: t } = useLocale();
  const copy = t.home.services;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const [paused, setPaused] = useState(false);

  const maxIndex = Math.max(0, services.length - 1);

  const goNext = useCallback(() => {
    setActiveIndex((current) => (current >= maxIndex ? 0 : current + 1));
  }, [maxIndex]);

  const goPrev = useCallback(() => {
    setActiveIndex((current) => (current <= 0 ? maxIndex : current - 1));
  }, [maxIndex]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const measure = () => {
      setSlideWidth(viewport.clientWidth);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [services.length]);

  useEffect(() => {
    if (paused || maxIndex === 0) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current >= maxIndex ? 0 : current + 1));
    }, AUTO_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [maxIndex, paused]);

  const translateX = slideWidth > 0 ? -activeIndex * slideWidth : 0;

  return (
    <section className="mx-auto w-[90%] max-w-[1200px] py-16">
      <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
        <div>
          <p className="text-sm font-semibold text-primary">{t.home.ourServices}</p>
          <h2 className="mt-2 text-3xl font-bold">{copy.title}</h2>
        </div>
        <Link
          href="/services"
          className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex"
        >
          {t.common.viewAll}
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </Link>
      </div>

      {services.length === 0 ? (
        <p className="text-muted">{copy.empty}</p>
      ) : (
        <>
          <div
            className="flex items-center gap-1.5 sm:hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
          >
            <button
              type="button"
              onClick={goPrev}
              disabled={maxIndex === 0}
              className={arrowClass}
              aria-label={copy.prevAria}
            >
              <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
            </button>

            <div ref={viewportRef} className="min-w-0 flex-1 overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                dir="ltr"
                style={{
                  transform: `translate3d(${translateX}px, 0, 0)`,
                }}
              >
                {services.map((service, index) => (
                  <div
                    key={service.id}
                    className="shrink-0"
                    style={{
                      width: slideWidth > 0 ? slideWidth : "100%",
                    }}
                    aria-hidden={index !== activeIndex}
                  >
                    <ServiceCard service={service} showCtaAlways />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={goNext}
              disabled={maxIndex === 0}
              className={arrowClass}
              aria-label={copy.nextAria}
            >
              <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
            </button>
          </div>

          <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </>
      )}

      <div className="mt-8 flex justify-center sm:hidden">
        <Link
          href="/services"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[20px] border border-[#94D4B9]/30 px-6 text-sm font-semibold text-[#94D4B9] transition-all duration-200 hover:bg-[#94D4B9]/10"
        >
          {t.common.viewAll}
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </Link>
      </div>
    </section>
  );
}
