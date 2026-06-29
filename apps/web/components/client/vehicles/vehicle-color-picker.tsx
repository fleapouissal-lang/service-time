"use client";

import { cn } from "@/lib/utils";
import type { VehicleColorOption } from "@/lib/vehicle-catalog";
import { getLocalizedColorName } from "@/lib/vehicle-catalog";
import type { Locale } from "@/lib/i18n/config";

type VehicleColorPickerProps = {
  label: string;
  optional?: boolean;
  optionalLabel?: string;
  value: string | null;
  onChange: (value: string) => void;
  options: readonly VehicleColorOption[];
  locale: Locale;
  className?: string;
};

export function VehicleColorPicker({
  label,
  optional = false,
  optionalLabel,
  value,
  onChange,
  options,
  locale,
  className,
}: VehicleColorPickerProps) {
  return (
    <div className={cn("add-vehicle-field", className)}>
      <div className="add-vehicle-field__label-row">
        <p className="add-vehicle-field__label">{label}</p>
        {optional && optionalLabel ? (
          <span className="add-vehicle-field__optional">{optionalLabel}</span>
        ) : null}
      </div>

      <div className="add-vehicle-color-grid" role="listbox" aria-label={label}>
        {options.map((option) => {
          const selected = value === option.id;
          const isLight = option.id === "white" || option.id === "beige";

          return (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(option.id)}
              className={cn(
                "add-vehicle-color-grid__item",
                selected && "add-vehicle-color-grid__item--selected",
              )}
            >
              <span
                className={cn(
                  "add-vehicle-color-grid__swatch",
                  isLight && "add-vehicle-color-grid__swatch--light",
                  option.id === "other" && "add-vehicle-color-grid__swatch--other",
                )}
                style={
                  option.id === "other"
                    ? undefined
                    : { backgroundColor: option.hex }
                }
                aria-hidden
              />
              <span className="add-vehicle-color-grid__label">
                {getLocalizedColorName(option, locale)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
