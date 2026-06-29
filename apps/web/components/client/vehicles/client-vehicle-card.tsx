"use client";

import { Palette, Trash2 } from "lucide-react";
import type { ClientVehicle } from "@service-time/types";
import { VehicleBrandLogo } from "@/components/client/vehicles/vehicle-brand-logo";
import {
  getVehicleBrandLogo,
  getVehicleDisplayName,
} from "@/lib/client-vehicle-display";
import {
  findVehicleBrand,
  findVehicleBrandModel,
  getLocalizedColorName,
  VEHICLE_COLOR_OPTIONS,
} from "@/lib/vehicle-catalog";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type ClientVehicleCardProps = {
  vehicle: ClientVehicle;
  onDelete?: (vehicle: ClientVehicle) => void;
  deleting?: boolean;
};

function formatPlate(vehicle: ClientVehicle): string | null {
  const letters = vehicle.plate_letters?.trim();
  const numbers = vehicle.plate_number?.trim();
  if (letters && numbers) return `${letters} ${numbers}`;
  return letters || numbers || null;
}

function getBrandModelNames(
  vehicle: ClientVehicle,
  locale: "ar" | "en",
): { brand: string; model: string | null } {
  if (vehicle.brand_slug) {
    const brand = findVehicleBrand(vehicle.brand_slug);
    const model = vehicle.model
      ? findVehicleBrandModel(vehicle.brand_slug, vehicle.model)
      : undefined;

    return {
      brand: brand
        ? locale === "ar"
          ? brand.nameAr
          : brand.nameEn
        : vehicle.brand?.trim() || "",
      model: model
        ? locale === "ar"
          ? model.nameAr
          : model.nameEn
        : vehicle.model?.trim() || null,
    };
  }

  const label = vehicle.label?.trim() || vehicle.brand?.trim() || "";
  return { brand: vehicle.brand?.trim() || label, model: null };
}

export function ClientVehicleCard({
  vehicle,
  onDelete,
  deleting = false,
}: ClientVehicleCardProps) {
  const { messages: t, locale } = useLocale();
  const logo = getVehicleBrandLogo(vehicle);
  const { brand, model } = getBrandModelNames(vehicle, locale);
  const displayName = getVehicleDisplayName(vehicle, locale);
  const plate = formatPlate(vehicle);
  const colorOption = vehicle.color
    ? VEHICLE_COLOR_OPTIONS.find((option) => option.id === vehicle.color)
    : undefined;
  const colorLabel = colorOption
    ? getLocalizedColorName(colorOption, locale)
    : null;
  const title = model ? brand : displayName;
  const subtitle = model || null;

  return (
    <article className="saved-vehicle-card">
      <div className="saved-vehicle-card__logo">
        <VehicleBrandLogo src={logo} alt={title} size="md" />
      </div>

      <div className="saved-vehicle-card__content min-w-0 flex-1">
        <p className="saved-vehicle-card__brand truncate">{title}</p>
        {subtitle ? (
          <p className="saved-vehicle-card__model truncate">{subtitle}</p>
        ) : null}

        <div className="saved-vehicle-card__meta">
          {colorLabel ? (
            <span className="saved-vehicle-card__meta-item">
              <span
                className={cn(
                  "saved-vehicle-card__swatch",
                  colorOption?.id === "other" && "saved-vehicle-card__swatch--other",
                  (colorOption?.id === "white" || colorOption?.id === "beige") &&
                    "saved-vehicle-card__swatch--light",
                )}
                style={
                  colorOption && colorOption.id !== "other"
                    ? { backgroundColor: colorOption.hex }
                    : undefined
                }
                aria-hidden
              />
              <span className="truncate">{colorLabel}</span>
            </span>
          ) : null}

          {plate ? (
            <span className="saved-vehicle-card__meta-item saved-vehicle-card__meta-item--plate" dir="ltr">
              {plate}
            </span>
          ) : null}

          {!colorLabel && !plate ? (
            <span className="saved-vehicle-card__meta-item saved-vehicle-card__meta-item--muted">
              <Palette className="size-3 shrink-0 opacity-70" aria-hidden />
              {t.clientVehicles.noExtraDetails}
            </span>
          ) : null}
        </div>
      </div>

      {onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(vehicle)}
          disabled={deleting}
          className="saved-vehicle-card__delete"
          aria-label={t.request.form.deleteVehicle}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      ) : null}
    </article>
  );
}
