import type { ClientVehicle } from "@service-time/types";
import type { Locale } from "@/lib/i18n/config";
import {
  findVehicleBrand,
  findVehicleBrandModel,
  getBrandLogoSrc,
  VEHICLE_BRANDS,
} from "@/lib/vehicle-catalog";

export function buildVehicleLabel(
  brand: string | null | undefined,
  model: string | null | undefined,
  year?: number | null,
): string {
  const parts = [brand?.trim(), model?.trim()].filter(Boolean) as string[];
  const base = parts.join(" ");
  if (year && year > 0) return `${base} ${year}`;
  return base;
}

export function getVehicleBrandLogo(vehicle: ClientVehicle): string | null {
  if (vehicle.brand_slug) {
    return getBrandLogoSrc(vehicle.brand_slug);
  }

  const brandName = vehicle.brand?.trim().toLowerCase();
  if (!brandName) return null;

  const match = VEHICLE_BRANDS.find(
    (brand) =>
      brand.slug === brandName ||
      brand.nameEn.toLowerCase() === brandName ||
      brand.nameAr.trim() === vehicle.brand?.trim(),
  );

  return match ? getBrandLogoSrc(match.slug) : null;
}

export function getVehicleDisplayName(
  vehicle: ClientVehicle,
  locale: Locale,
): string {
  if (vehicle.brand_slug) {
    const brand = findVehicleBrand(vehicle.brand_slug);
    const model = vehicle.model
      ? findVehicleBrandModel(vehicle.brand_slug, vehicle.model)
      : undefined;
    const brandName = brand
      ? locale === "ar"
        ? brand.nameAr
        : brand.nameEn
      : vehicle.brand ?? "";
    const modelName = model
      ? locale === "ar"
        ? model.nameAr
        : model.nameEn
      : vehicle.model ?? "";
    const name = buildVehicleLabel(brandName, modelName, vehicle.year);
    if (name.trim()) return name;
  }

  return vehicle.label?.trim() || vehicle.brand?.trim() || "";
}

export function getVehicleShortName(
  vehicle: ClientVehicle,
  locale: Locale,
): string {
  if (vehicle.brand_slug) {
    const brand = findVehicleBrand(vehicle.brand_slug);
    const model = vehicle.model
      ? findVehicleBrandModel(vehicle.brand_slug, vehicle.model)
      : undefined;
    const brandName = brand
      ? locale === "ar"
        ? brand.nameAr
        : brand.nameEn
      : vehicle.brand ?? "";
    const modelName = model
      ? locale === "ar"
        ? model.nameAr
        : model.nameEn
      : vehicle.model ?? "";
    const name = buildVehicleLabel(brandName, modelName);
    if (name.trim()) return name;
  }
  return vehicle.label?.trim() || vehicle.brand?.trim() || "";
}

export type ClientVehicleInput = {
  brandSlug: string;
  modelId: string;
  brandName: string;
  modelName: string;
  cylinders?: number | null;
  fuelType?: ClientVehicle["fuel_type"];
  chassisNumber?: string | null;
  plateLetters?: string | null;
  plateNumber?: string | null;
  color?: string | null;
  year?: number | null;
};

export function buildClientVehiclePayload(input: ClientVehicleInput) {
  const label = buildVehicleLabel(input.brandName, input.modelName, input.year);
  return {
    label,
    brand: input.brandName,
    model: input.modelId,
    brand_slug: input.brandSlug,
    cylinders: input.cylinders ?? null,
    fuel_type: input.fuelType ?? null,
    chassis_number: input.chassisNumber?.trim() || null,
    plate_letters: input.plateLetters?.trim().toUpperCase() || null,
    plate_number: input.plateNumber?.trim() || null,
    color: input.color ?? null,
    year: input.year ?? null,
  };
}
