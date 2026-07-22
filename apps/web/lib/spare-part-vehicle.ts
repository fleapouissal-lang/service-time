import type { SparePart } from "@service-time/types";
import type { IconSelectOption } from "@/lib/icon-select-options";
import {
  VEHICLE_BRANDS,
  findVehicleBrand,
  findVehicleBrandModel,
  getLocalizedBrandName,
  getLocalizedModelName,
} from "@/lib/vehicle-catalog";

export function parseSparePartVehicleFields(formData: FormData): {
  vehicle_brand_slug: string | null;
  vehicle_model_id: string | null;
} {
  const brand = String(formData.get("vehicle_brand_slug") ?? "").trim();
  if (!brand || brand === "all") {
    return { vehicle_brand_slug: null, vehicle_model_id: null };
  }

  const model = String(formData.get("vehicle_model_id") ?? "").trim();
  if (!model || model === "all") {
    return { vehicle_brand_slug: brand, vehicle_model_id: null };
  }

  return { vehicle_brand_slug: brand, vehicle_model_id: model };
}

export function sparePartMatchesVehicleFilter(
  part: Pick<SparePart, "vehicle_brand_slug" | "vehicle_model_id">,
  brand?: string,
  model?: string,
): boolean {
  if (!brand || brand === "all") return true;

  if (!part.vehicle_brand_slug) return true;
  if (part.vehicle_brand_slug !== brand) return false;

  if (!model || model === "all") return true;
  if (!part.vehicle_model_id) return true;
  return part.vehicle_model_id === model;
}

export function getSparePartVehicleLabel(
  part: Pick<SparePart, "vehicle_brand_slug" | "vehicle_model_id">,
  locale: "ar" | "en",
  allLabel: string,
): string {
  if (!part.vehicle_brand_slug) return allLabel;

  const brand = findVehicleBrand(part.vehicle_brand_slug);
  if (!brand) return part.vehicle_brand_slug;

  const brandName = getLocalizedBrandName(brand, locale);
  if (!part.vehicle_model_id) return brandName;

  const model = findVehicleBrandModel(part.vehicle_brand_slug, part.vehicle_model_id);
  if (!model) return brandName;

  return `${brandName} · ${getLocalizedModelName(model, locale)}`;
}

export function buildVehicleBrandSelectOptions(
  locale: "ar" | "en",
  allLabel: string,
): IconSelectOption[] {
  return [
    { value: "all", label: allLabel, icon: "car" },
    ...VEHICLE_BRANDS.map((brand) => ({
      value: brand.slug,
      label: getLocalizedBrandName(brand, locale),
      icon: "car" as const,
    })),
  ];
}

export function buildVehicleModelSelectOptions(
  brandSlug: string | undefined,
  locale: "ar" | "en",
  allLabel: string,
): IconSelectOption[] {
  if (!brandSlug || brandSlug === "all") {
    return [{ value: "all", label: allLabel, icon: "layers" }];
  }

  const brand = findVehicleBrand(brandSlug);
  if (!brand) {
    return [{ value: "all", label: allLabel, icon: "layers" }];
  }

  return [
    { value: "all", label: allLabel, icon: "layers" },
    ...brand.models.map((model) => ({
      value: model.id,
      label: getLocalizedModelName(model, locale),
      icon: "car" as const,
    })),
  ];
}
