"use client";

import {
  AlertTriangle,
  ArrowDown,
  Building2,
  Calendar,
  CalendarRange,
  Car,
  CheckCircle2,
  ChevronDown,
  Circle,
  Inbox,
  Layers,
  MapPin,
  Minus,
  Package,
  Plus,
  Shield,
  Sun,
  Truck,
  User,
  UserCheck,
  UserX,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { IconSelectOption } from "@/lib/icon-select-options";
import { cn } from "@/lib/utils";

export type { IconSelectOption };

const SELECT_ICONS: Record<string, LucideIcon> = {
  circle: Circle,
  layers: Layers,
  inbox: Inbox,
  "user-check": UserCheck,
  wrench: Wrench,
  truck: Truck,
  "map-pin": MapPin,
  "check-circle-2": CheckCircle2,
  "x-circle": XCircle,
  "arrow-down": ArrowDown,
  minus: Minus,
  "alert-triangle": AlertTriangle,
  package: Package,
  sun: Sun,
  calendar: Calendar,
  "calendar-range": CalendarRange,
  user: User,
  shield: Shield,
  "building-2": Building2,
  car: Car,
  "user-x": UserX,
  plus: Plus,
};

function resolveIcon(key?: string, fallback: LucideIcon = Circle): LucideIcon {
  if (!key) return fallback;
  return SELECT_ICONS[key] ?? fallback;
}

type IconSelectProps = {
  id?: string;
  name?: string;
  options: IconSelectOption[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  className?: string;
  fallbackIcon?: string;
};

export function IconSelect({
  id,
  name,
  options,
  defaultValue,
  value: controlledValue,
  onValueChange,
  required,
  className,
  fallbackIcon = "circle",
}: IconSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? options[0]?.value ?? "",
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const FallbackIcon = resolveIcon(fallbackIcon);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  useEffect(() => {
    if (isControlled) return;
    if (defaultValue !== undefined) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue, isControlled]);

  const selected =
    options.find((option) => option.value === value) ?? options[0];
  const SelectedIcon = resolveIcon(selected?.icon, FallbackIcon);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function commitValue(next: string) {
    if (!isControlled) {
      setInternalValue(next);
    }
    onValueChange?.(next);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {name ? (
        <input type="hidden" name={name} value={value} required={required} />
      ) : null}

      <button
        type="button"
        id={selectId}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-11 w-full items-center gap-3 rounded-xl border border-[#94D4B9]/15 bg-[#091014] px-3 text-sm text-foreground transition-all duration-200",
          "hover:border-[#94D4B9]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#94D4B9]/40",
          open && "border-[#94D4B9]/40 ring-2 ring-[#94D4B9]/25",
        )}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#94D4B9]/10">
          <SelectedIcon className="size-4 text-[#94D4B9]" aria-hidden />
        </span>
        <span className="flex-1 truncate text-start">{selected?.label}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted transition-transform duration-200",
            open && "rotate-180 text-[#94D4B9]",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-labelledby={selectId}
          className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-[20px] border border-[#94D4B9]/20 bg-[#091014] p-1.5 shadow-[0_16px_52px_rgba(148,212,185,0.22)]"
        >
          {options.map((option, index) => {
            const Icon = resolveIcon(option.icon, FallbackIcon);
            const isSelected = option.value === value;
            const optionKey =
              option.value !== ""
                ? option.value
                : `${option.label}-${index}`;

            return (
              <li
                key={optionKey}
                role="option"
                aria-selected={isSelected}
              >
                <button
                  type="button"
                  onClick={() => commitValue(option.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm transition-all duration-200",
                    isSelected
                      ? "bg-[#94D4B9]/15 font-medium text-[#94D4B9]"
                      : "text-foreground hover:bg-[#94D4B9]/8 hover:text-[#94D4B9]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isSelected ? "bg-[#94D4B9]/20" : "bg-[#94D4B9]/10",
                    )}
                  >
                    <Icon className="size-4 text-[#94D4B9]" aria-hidden />
                  </span>
                  <span className="flex-1 text-start">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
