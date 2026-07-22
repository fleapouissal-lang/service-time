"use client";

import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import type { ListFilterParams } from "@/lib/list-filters";
import { getSparePartConditionFilterOptions } from "@/lib/spare-part-condition";
import { buildVehicleBrandSelectOptions } from "@/lib/spare-part-vehicle";
import { findVehicleBrand, getLocalizedModelName } from "@/lib/vehicle-catalog";
import { useLocale } from "@/lib/i18n/locale-context";

type SparePartsFilterBarProps = {
  values: ListFilterParams;
  categories: { value: string; label: string }[];
  searchPlaceholder: string;
  categoryLabel: string;
  resultCount: number;
  totalCount: number;
  preserveParams?: Record<string, string | undefined>;
};

export function SparePartsFilterBar({
  values,
  categories,
  searchPlaceholder,
  categoryLabel,
  resultCount,
  totalCount,
  preserveParams,
}: SparePartsFilterBarProps) {
  const { messages: t, locale } = useLocale();
  const labels = t.spareParts.vehicle;
  const conditionOptions = getSparePartConditionFilterOptions(t);
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

  const selects = [
    {
      name: "condition",
      label: t.spareParts.condition.label,
      options: conditionOptions,
      allLabel: t.spareParts.condition.all,
    },
    ...(categories.length > 0
      ? [{ name: "category", label: categoryLabel, options: categories }]
      : []),
    {
      name: "vehicle_brand",
      label: labels.brand,
      options: brandOptions,
      allLabel: labels.allBrands,
      resolveParams: (next: string) =>
        next === "all"
          ? {
              vehicle_brand: undefined,
              vehicle_model: undefined,
              vehicle_scope: "none",
            }
          : {
              vehicle_brand: next,
              vehicle_model: undefined,
              vehicle_scope: undefined,
            },
    },
    {
      name: "vehicle_model",
      label: labels.model,
      options: modelOptions,
      allLabel: selectedBrand ? labels.allModels : labels.selectBrandFirst,
      remountKey: `vehicle-model-${brand}`,
    },
  ];

  return (
    <DashboardFilterBar
      pathname="/spare-parts"
      values={values}
      searchPlaceholder={searchPlaceholder}
      selects={selects}
      resultCount={resultCount}
      totalCount={totalCount}
      preserveParams={preserveParams}
      hiddenFields={["size"]}
      singleRow
      autoSubmit
      plain
      className="mb-6"
    />
  );
}
