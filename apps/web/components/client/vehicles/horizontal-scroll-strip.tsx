"use client";

import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type HorizontalScrollStripProps = {
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
  contentClassName?: string;
  scrollPrevLabel: string;
  scrollNextLabel: string;
};

export function HorizontalScrollStrip({
  children,
  ariaLabel,
  className,
  contentClassName,
  scrollPrevLabel,
  scrollNextLabel,
}: HorizontalScrollStripProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ active: boolean; startX: number; scrollLeft: number }>({
    active: false,
    startX: 0,
    scrollLeft: 0,
  });

  const scroll = useCallback((direction: "prev" | "next") => {
    const node = scrollerRef.current;
    if (!node) return;

    const step = Math.max(176, Math.round(node.clientWidth * 0.72));
    const rtl = getComputedStyle(node).direction === "rtl";
    let delta = direction === "next" ? step : -step;
    if (rtl) delta = -delta;

    node.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const node = scrollerRef.current;
    if (!node || event.pointerType === "touch") return;
    if ((event.target as HTMLElement).closest("button")) return;

    dragRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: node.scrollLeft,
    };
    node.setPointerCapture(event.pointerId);
    node.classList.add("add-vehicle-scroll-row--dragging");
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const node = scrollerRef.current;
    if (!node || !dragRef.current.active) return;

    const dx = event.clientX - dragRef.current.startX;
    node.scrollLeft = dragRef.current.scrollLeft - dx;
  }, []);

  const endDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const node = scrollerRef.current;
    if (!node || !dragRef.current.active) return;

    dragRef.current.active = false;
    node.classList.remove("add-vehicle-scroll-row--dragging");
    if (node.hasPointerCapture(event.pointerId)) {
      node.releasePointerCapture(event.pointerId);
    }
  }, []);

  return (
    <div className={cn("add-vehicle-scroll-strip", className)}>
      <button
        type="button"
        className="add-vehicle-scroll-strip__btn add-vehicle-scroll-strip__btn--prev"
        aria-label={scrollPrevLabel}
        onClick={() => scroll("prev")}
      >
        <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
      </button>

      <div
        ref={scrollerRef}
        role="listbox"
        className={cn(
          "add-vehicle-scroll-row add-vehicle-scroll-row--hidden-bar",
          contentClassName,
        )}
        aria-label={ariaLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {children}
      </div>

      <button
        type="button"
        className="add-vehicle-scroll-strip__btn add-vehicle-scroll-strip__btn--next"
        aria-label={scrollNextLabel}
        onClick={() => scroll("next")}
      >
        <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
      </button>
    </div>
  );
}
