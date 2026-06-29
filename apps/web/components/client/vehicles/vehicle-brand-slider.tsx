"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { VehicleCatalogBrand } from "@/lib/vehicle-catalog";
import { getLocalizedBrandName } from "@/lib/vehicle-catalog";
import type { Locale } from "@/lib/i18n/config";
import { HorizontalScrollStrip } from "@/components/client/vehicles/horizontal-scroll-strip";

type VehicleBrandSliderProps = {
  label: string;
  brands: VehicleCatalogBrand[];
  value: string | null;
  onChange: (slug: string) => void;
  locale: Locale;
  className?: string;
  hideLabel?: boolean;
  scrollPrevLabel: string;
  scrollNextLabel: string;
};

export function VehicleBrandSlider({
  label,
  brands,
  value,
  onChange,
  locale,
  className,
  hideLabel = false,
  scrollPrevLabel,
  scrollNextLabel,
}: VehicleBrandSliderProps) {
  return (
    <div className={cn("add-vehicle-field", className)}>
      <p className={cn("add-vehicle-field__label", hideLabel && "sr-only")}>
        {label}
      </p>
      <HorizontalScrollStrip
        ariaLabel={label}
        scrollPrevLabel={scrollPrevLabel}
        scrollNextLabel={scrollNextLabel}
        contentClassName="add-vehicle-brand-row"
      >
        {brands.map((brand) => {
          const selected = value === brand.slug;
          return (
            <button
              key={brand.slug}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(brand.slug)}
              className={cn(
                "add-vehicle-brand-card",
                selected && "add-vehicle-brand-card--selected",
              )}
            >
              <Image
                src={brand.logoSrc}
                alt=""
                width={48}
                height={48}
                className="add-vehicle-brand-card__logo"
              />
              <span className="add-vehicle-brand-card__name">
                {getLocalizedBrandName(brand, locale)}
              </span>
            </button>
          );
        })}
      </HorizontalScrollStrip>
    </div>
  );
}
