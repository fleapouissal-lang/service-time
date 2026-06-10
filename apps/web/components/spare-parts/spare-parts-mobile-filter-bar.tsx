"use client";

import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import type { ListFilterParams } from "@/lib/list-filters";

type SparePartsMobileFilterBarProps = {
  values: ListFilterParams;
  categories: { value: string; label: string }[];
  searchPlaceholder: string;
  categoryLabel: string;
  resultCount: number;
  totalCount: number;
  preserveParams?: Record<string, string | undefined>;
};

export function SparePartsMobileFilterBar({
  values,
  categories,
  searchPlaceholder,
  categoryLabel,
  resultCount,
  totalCount,
  preserveParams,
}: SparePartsMobileFilterBarProps) {
  return (
    <DashboardFilterBar
      pathname="/spare-parts"
      values={values}
      searchPlaceholder={searchPlaceholder}
      selects={
        categories.length > 0
          ? [{ name: "category", label: categoryLabel, options: categories }]
          : []
      }
      resultCount={resultCount}
      totalCount={totalCount}
      preserveParams={preserveParams}
      hiddenFields={["size"]}
      mobileOnly
      className="mb-4"
    />
  );
}
