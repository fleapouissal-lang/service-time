"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
  Smartphone,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AboutSectionHeader } from "@/components/about/about-section-header";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

const VALUE_ICONS: LucideIcon[] = [Award, Zap, Eye, ShieldCheck, Smartphone];

const AUTO_INTERVAL_MS = 4500;
const VISIBLE_MD = 3;
const VISIBLE_SM = 1;

export function AboutValuesCarousel() {
  const { messages: t } = useLocale();
  const values = t.about.values;
  const items = values.items;
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [visibleCount, setVisibleCount] = useState(VISIBLE_MD);
  const [paused, setPaused] = useState(false);

  const maxIndex = Math.max(0, items.length - visibleCount);

  const clampIndex = useCallback(
    (index: number) => {
      if (maxIndex === 0) return 0;
      if (index < 0) return maxIndex;
      if (index > maxIndex) return 0;
      return index;
    },
    [maxIndex],
  );

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(clampIndex(index));
    },
    [clampIndex],
  );

  const goNext = useCallback(() => {
    setActiveIndex((current) =>
      current >= maxIndex ? 0 : current + 1,
    );
  }, [maxIndex]);

  const goPrev = useCallback(() => {
    setActiveIndex((current) =>
      current <= 0 ? maxIndex : current - 1,
    );
  }, [maxIndex]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const updateVisible = () => {
      setVisibleCount(mq.matches ? VISIBLE_MD : VISIBLE_SM);
    };

    updateVisible();
    mq.addEventListener("change", updateVisible);
    return () => mq.removeEventListener("change", updateVisible);
  }, []);

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      const first = track?.querySelector<HTMLElement>("[data-value-card]");
      if (!first || !track) return;

      const gap = parseFloat(getComputedStyle(track).columnGap || track.style.gap) || 20;
      setStep(first.offsetWidth + gap);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [visibleCount]);

  useEffect(() => {
    if (paused || maxIndex === 0) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(goNext, AUTO_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [goNext, maxIndex, paused]);

  return (
    <section className="space-y-8">
      <AboutSectionHeader
        eyebrow={values.eyebrow}
        title={values.title}
        description={values.description}
      />

      <div
        className="flex items-center gap-3 sm:gap-4"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setPaused(false);
          }
        }}
      >
        <button
          type="button"
          onClick={goPrev}
          disabled={maxIndex === 0}
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#94D4B9]/30 text-[#94D4B9] transition-colors hover:border-[#94D4B9]/50 hover:bg-[#94D4B9]/10",
            maxIndex === 0 && "pointer-events-none opacity-40",
          )}
          aria-label={values.prevAria}
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            ref={trackRef}
            className="flex gap-5 transition-transform duration-500 ease-out"
            style={{
              transform: step ? `translate3d(${activeIndex * step}px, 0, 0)` : undefined,
            }}
          >
            {items.map((item, index) => {
              const Icon = VALUE_ICONS[index] ?? Award;

              return (
                <div
                  key={item.title}
                  data-value-card
                  className="flex min-h-[220px] min-w-full shrink-0 flex-col rounded-[20px] border border-[#94D4B9]/10 bg-[#091014] p-6 shadow-[0_4px_24px_rgba(148,212,185,0.06)] md:min-w-[calc((100%-2.5rem)/3)] md:flex-[0_0_calc((100%-2.5rem)/3)]"
                >
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
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={maxIndex === 0}
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-[#94D4B9]/30 text-[#94D4B9] transition-colors hover:border-[#94D4B9]/50 hover:bg-[#94D4B9]/10",
            maxIndex === 0 && "pointer-events-none opacity-40",
          )}
          aria-label={values.nextAria}
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
      </div>

      <div
        className="flex items-center justify-center gap-2"
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
    </section>
  );
}
