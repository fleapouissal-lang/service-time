"use client";

import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { getActiveFilterOptionsForDashboard } from "@/lib/dashboard-filter-options";
import type { ListFilterParams } from "@/lib/list-filters";
import { getSparePartConditionFilterOptions } from "@/lib/spare-part-condition";
import { buildVehicleBrandSelectOptions } from "@/lib/spare-part-vehicle";
import { findVehicleBrand, getLocalizedModelName } from "@/lib/vehicle-catalog";
import { useLocale } from "@/lib/i18n/locale-context";

type AdminSparePartsFilterBarProps = {
  values: ListFilterParams;
  categories: { value: string; label: string }[];
  resultCount: number;
  totalCount: number;
};

export function AdminSparePartsFilterBar({
  values,
  categories,
  resultCount,
  totalCount,
}: AdminSparePartsFilterBarProps) {
  const { messages: t, locale } = useLocale();
  const labels = t.spareParts.vehicle;
  const brand = values.vehicle_brand?.trim() || "all";
  const selectedBrand = brand !== "all" ? findVehicleBrand(brand) : undefined;

  const brandOptions = buildVehicleBrandSelectOptions(locale, labels.allBrands)
    .filter((option) => option.value !== "all")
    .map(({ value, label }) => ({ value, label }));

  const modelOptions = selectedBrand
    ? selectedBrand.models.map((model) => ({
        value: model.id,
        label: getLocalizedModelName(model, locale),
      }))
    : [];

  return (
    <DashboardFilterBar
      pathname="/admin/spare-parts"
      values={values}
      searchPlaceholder={t.dashboard.filters.sparePartSearch}
      selects={[
        {
          name: "condition",
          label: t.spareParts.condition.label,
          options: getSparePartConditionFilterOptions(t),
          allLabel: t.spareParts.condition.all,
        },
        { name: "category", label: t.common.category, options: categories },
        {
          name: "vehicle_brand",
          label: labels.brand,
          options: brandOptions,
          allLabel: labels.allBrands,
          clearOnChange: ["vehicle_model"],
        },
        {
          name: "vehicle_model",
          label: labels.model,
          options: modelOptions,
          allLabel: selectedBrand ? labels.allModels : labels.selectBrandFirst,
          remountKey: `vehicle-model-${brand}`,
        },
        {
          name: "active",
          label: t.common.status,
          options: getActiveFilterOptionsForDashboard(t),
        },
      ]}
      resultCount={resultCount}
      totalCount={totalCount}
      autoSubmit
      plain
    />
  );
}
