"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Award,
  Eye,
  ShieldCheck,
  Smartphone,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AboutSectionHeader } from "@/components/about/about-section-header";
import {
  LocaleCarouselNext,
  LocaleCarouselPrev,
} from "@/components/ui/locale-arrows";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

const VALUE_ICONS: LucideIcon[] = [Award, Zap, Eye, ShieldCheck, Smartphone];

const GAP_PX = 20;
const VISIBLE_DESKTOP = 3;
const VISIBLE_MOBILE = 1;
const DESKTOP_MQ = "(min-width: 768px)";

const arrowClass = cn(
  "inline-flex shrink-0 items-center justify-center rounded-full transition-all duration-300",
  "disabled:pointer-events-none disabled:opacity-40",
  "md:size-10 md:border md:border-[#94D4B9]/30 md:bg-transparent md:text-[#94D4B9]",
  "md:shadow-none md:hover:border-[#94D4B9]/50 md:hover:bg-[#94D4B9]/10",
);

const mobileOverlayArrowClass = cn(
  arrowClass,
  "absolute top-1/2 z-10 size-9 -translate-y-1/2 border border-[#94D4B9]/25 bg-[#050B10]/85 text-[#94D4B9] backdrop-blur-sm",
  "shadow-[0_4px_16px_rgba(0,0,0,0.45)] active:scale-95 md:hidden",
);

type CarouselMetrics = {
  cardWidth: number;
  step: number;
};

export function AboutValuesCarousel() {
  const { messages: t } = useLocale();
  const values = t.about.values;
  const items = values.items;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(VISIBLE_DESKTOP);
  const [metrics, setMetrics] = useState<CarouselMetrics>({
    cardWidth: 0,
    step: 0,
  });
  const [paused, setPaused] = useState(false);

  const maxIndex = Math.max(0, items.length - visibleCount);

  const goNext = useCallback(() => {
    setActiveIndex((current) => (current >= maxIndex ? 0 : current + 1));
  }, [maxIndex]);

  const goPrev = useCallback(() => {
    setActiveIndex((current) => (current <= 0 ? maxIndex : current - 1));
  }, [maxIndex]);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(Math.max(0, Math.min(index, maxIndex)));
    },
    [maxIndex],
  );

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MQ);
    const updateVisible = () => {
      setVisibleCount(media.matches ? VISIBLE_DESKTOP : VISIBLE_MOBILE);
    };

    updateVisible();
    media.addEventListener("change", updateVisible);
    return () => media.removeEventListener("change", updateVisible);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const measure = () => {
      const width = viewport.clientWidth;

      if (visibleCount === 1) {
        setMetrics({ cardWidth: width, step: width });
        return;
      }

      const cardWidth = (width - GAP_PX * (visibleCount - 1)) / visibleCount;
      setMetrics({
        cardWidth,
        step: cardWidth + GAP_PX,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [visibleCount]);

  useEffect(() => {
    if (paused || maxIndex === 0) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(goNext, 4500);
    return () => window.clearInterval(timer);
  }, [goNext, maxIndex, paused]);

  const translateX =
    metrics.step > 0 ? -activeIndex * metrics.step : 0;

  return (
    <section className="space-y-8">
      <AboutSectionHeader
        eyebrow={values.eyebrow}
        title={values.title}
        description={values.description}
      />

      <div
        className="relative md:flex md:items-center md:gap-4"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setPaused(false);
          }
        }}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        <button
          type="button"
          onClick={goPrev}
          disabled={maxIndex === 0}
          className={cn(arrowClass, "hidden md:inline-flex self-center")}
          aria-label={values.prevAria}
        >
          <LocaleCarouselPrev className="size-5" />
        </button>

        <div
          ref={viewportRef}
          className="relative min-w-0 flex-1 overflow-hidden"
        >
          <button
            type="button"
            onClick={goPrev}
            disabled={maxIndex === 0}
            className={cn(mobileOverlayArrowClass, "start-2")}
            aria-label={values.prevAria}
          >
            <LocaleCarouselPrev className="size-4" />
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={maxIndex === 0}
            className={cn(mobileOverlayArrowClass, "end-2")}
            aria-label={values.nextAria}
          >
            <LocaleCarouselNext className="size-4" />
          </button>

          <div
            className="flex gap-0 transition-transform duration-500 ease-out md:gap-5"
            dir="ltr"
            style={{
              transform: `translate3d(${translateX}px, 0, 0)`,
            }}
          >
            {items.map((item, index) => {
              const Icon = VALUE_ICONS[index] ?? Award;
              const isVisible =
                index >= activeIndex && index < activeIndex + visibleCount;

              return (
                <div
                  key={item.title}
                  className="shrink-0"
                  style={{
                    width:
                      metrics.cardWidth > 0
                        ? metrics.cardWidth
                        : "100%",
                  }}
                  aria-hidden={!isVisible}
                >
                  <div className="flex min-h-[220px] flex-col rounded-2xl border border-[#94D4B9]/10 bg-[#091014] p-4 px-12 shadow-[0_4px_24px_rgba(148,212,185,0.06)] md:rounded-[20px] md:p-6 md:px-6">
                    <span className="mb-4 flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#94D4B9]/10">
                      <Icon className="size-5 text-[#94D4B9]" aria-hidden />
                    </span>
                    <h3 className="text-lg font-semibold text-[#94D4B9]">
                      {item.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 min-h-[5.25rem] text-sm leading-7 text-muted">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={maxIndex === 0}
          className={cn(arrowClass, "hidden md:inline-flex self-center")}
          aria-label={values.nextAria}
        >
          <LocaleCarouselNext className="size-5" />
        </button>
      </div>

      {maxIndex > 0 ? (
        <div
          className="hidden items-center justify-center gap-2 md:flex"
          role="tablist"
          aria-label={values.indicatorsAria}
        >
          {Array.from({ length: maxIndex + 1 }, (_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={values.slideAria.replace("{n}", String(index + 1))}
              onClick={() => goTo(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === activeIndex
                  ? "w-8 bg-[#94D4B9]"
                  : "w-2 bg-[#94D4B9]/30 hover:bg-[#94D4B9]/50",
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
