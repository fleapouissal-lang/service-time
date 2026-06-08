"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterToggleButtonProps = {
  open: boolean;
  onToggle: () => void;
  active?: boolean;
  showLabel?: string;
  hideLabel?: string;
  className?: string;
};

export function FilterToggleButton({
  open,
  onToggle,
  active = false,
  showLabel,
  hideLabel,
  className,
}: FilterToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? hideLabel : showLabel}
      className={cn(
        "relative shrink-0 p-2 text-[#94D4B9] transition-opacity hover:opacity-80 active:opacity-70",
        className,
      )}
    >
      {open ? (
        <X className="size-5" aria-hidden />
      ) : (
        <SlidersHorizontal className="size-5" aria-hidden />
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
