"use client";

import { cn } from "@/lib/utils";
import { HorizontalScrollStrip } from "@/components/client/vehicles/horizontal-scroll-strip";

type VehicleChipSelectProps<T extends string | number> = {
  label: string;
  optional?: boolean;
  optionalLabel?: string;
  value: T | null;
  onChange: (value: T) => void;
  options: readonly {
    value: T;
    label: string;
    leading?: React.ReactNode;
  }[];
  className?: string;
  hideScrollbar?: boolean;
  scrollPrevLabel?: string;
  scrollNextLabel?: string;
};

export function VehicleChipSelect<T extends string | number>({
  label,
  optional = false,
  optionalLabel,
  value,
  onChange,
  options,
  className,
  hideScrollbar = true,
  scrollPrevLabel = "Scroll left",
  scrollNextLabel = "Scroll right",
}: VehicleChipSelectProps<T>) {
  return (
    <div className={cn("add-vehicle-field", className)}>
      <div className="add-vehicle-field__label-row">
        <p className="add-vehicle-field__label">{label}</p>
        {optional && optionalLabel ? (
          <span className="add-vehicle-field__optional">{optionalLabel}</span>
        ) : null}
      </div>
      <HorizontalScrollStrip
        ariaLabel={label}
        scrollPrevLabel={scrollPrevLabel}
        scrollNextLabel={scrollNextLabel}
        contentClassName={cn(
          "add-vehicle-chip-row",
          !hideScrollbar && "add-vehicle-scroll-row--show-bar",
        )}
      >
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={String(option.value)}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "add-vehicle-chip",
                selected && "add-vehicle-chip--selected",
              )}
            >
              {option.leading}
              <span>{option.label}</span>
            </button>
          );
        })}
      </HorizontalScrollStrip>
    </div>
  );
}
