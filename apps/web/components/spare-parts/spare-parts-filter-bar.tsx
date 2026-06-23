"use client";

import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import type { ListFilterParams } from "@/lib/list-filters";
import { getSparePartConditionFilterOptions } from "@/lib/spare-part-condition";
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
  const { messages: t } = useLocale();
  const conditionOptions = getSparePartConditionFilterOptions(t);

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
      className="mb-6"
    />
  );
}
