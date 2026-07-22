"use client";

import {
  AlertTriangle,
  ArrowDown,
  Building2,
  Calendar,
  CalendarRange,
  Car,
  Check,
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
import {
  iconAccentBgClass,
  iconAccentClass,
} from "@/lib/card-surface";
import type { IconSelectOption } from "@/lib/icon-select-options";
import { requestFieldShellClass } from "@/lib/request-styles";
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
  const listId = `${selectId}-listbox`;
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
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function commitValue(next: string) {
    if (!isControlled) {
      setInternalValue(next);
    }
    onValueChange?.(next);
    setOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative", open && "z-[1000]", className)}
    >
      {name ? (
        <input type="hidden" name={name} value={value} required={required} />
      ) : null}

      <button
        type="button"
        id={selectId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm text-foreground transition-all duration-200",
          requestFieldShellClass,
          "focus-visible:outline-none",
          open &&
            "border-[color:var(--request-field-focus-border)] shadow-[0_0_0_2px_var(--request-field-focus-ring)]",
        )}
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg",
            iconAccentBgClass,
          )}
        >
          <SelectedIcon className={cn("size-3.5", iconAccentClass)} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate text-start font-medium">
          {selected?.label || "—"}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted transition-transform duration-200",
            open && cn("rotate-180", iconAccentClass),
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={selectId}
          className={cn(
            "scrollbar-theme absolute inset-x-0 z-[1000] mt-1.5 max-h-64 overflow-y-auto",
            "rounded-2xl border border-[color:var(--request-select-dropdown-border)]",
            "bg-[color:var(--request-select-dropdown-bg)] p-1.5",
            "shadow-[var(--request-select-dropdown-shadow)]",
            "ring-1 ring-black/5 dark:ring-white/5",
          )}
        >
          {options.map((option, index) => {
            const Icon = resolveIcon(option.icon, FallbackIcon);
            const isSelected = option.value === value;
            const optionKey =
              option.value !== ""
                ? option.value
                : `${option.label}-${index}`;

            return (
              <li key={optionKey} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => commitValue(option.value)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors",
                    isSelected
                      ? "bg-[color:var(--request-select-option-selected-bg)] font-semibold text-foreground"
                      : "text-foreground hover:bg-[color:var(--request-select-option-hover-bg)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg",
                      isSelected
                        ? "bg-[color-mix(in_srgb,var(--icon-accent)_22%,transparent)]"
                        : iconAccentBgClass,
                    )}
                  >
                    <Icon
                      className={cn("size-3.5", iconAccentClass)}
                      aria-hidden
                    />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-start">
                    {option.label}
                  </span>
                  {isSelected ? (
                    <Check
                      className={cn("size-4 shrink-0", iconAccentClass)}
                      aria-hidden
                    />
                  ) : (
                    <span className="size-4 shrink-0" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
