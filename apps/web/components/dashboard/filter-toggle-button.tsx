"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterToggleButtonProps = {
  open: boolean;
  onToggle: () => void;
  active?: boolean;
  text?: string;
  showLabel?: string;
  hideLabel?: string;
  className?: string;
};

export function FilterToggleButton({
  open,
  onToggle,
  active = false,
  text,
  showLabel,
  hideLabel,
  className,
}: FilterToggleButtonProps) {
  const visibleText = text ?? showLabel;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? hideLabel : showLabel}
      className={cn(
        "relative inline-flex shrink-0 items-center gap-1.5 p-2 text-[#94D4B9] transition-opacity hover:opacity-80 active:opacity-70",
        className,
      )}
    >
      {open ? (
        <>
          <X className="size-5 shrink-0" aria-hidden />
          {hideLabel ? (
            <span className="text-sm font-semibold">{hideLabel}</span>
          ) : null}
        </>
      ) : (
        <>
          <SlidersHorizontal className="size-5 shrink-0" aria-hidden />
          {visibleText ? (
            <span className="text-sm font-semibold">{visibleText}</span>
          ) : null}
        </>
      )}
      {active && !open ? (
        <span
          className="absolute top-1 end-1 size-1.5 rounded-full bg-[#94D4B9]"
          aria-hidden
        />
      ) : null}
    </button>
  );
}
