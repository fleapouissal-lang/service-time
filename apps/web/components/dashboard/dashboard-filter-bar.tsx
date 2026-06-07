"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconSelect } from "@/components/ui/icon-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasActiveListFilters, type ListFilterParams } from "@/lib/list-filters";
import { buildFilterSelectOptions } from "@/lib/select-option-builders";
import { cn } from "@/lib/utils";

export type DashboardFilterSelect = {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  allLabel?: string;
  hideAllOption?: boolean;
};

type DashboardFilterBarProps = {
  pathname: string;
  values: ListFilterParams;
  selects?: DashboardFilterSelect[];
  searchPlaceholder?: string;
  showSearch?: boolean;
  resultCount?: number;
  totalCount?: number;
  className?: string;
  preserveParams?: Record<string, string | undefined>;
  hiddenFields?: string[];
};

export function DashboardFilterBar({
  pathname,
  values,
  selects = [],
  searchPlaceholder = "بحث...",
  showSearch = true,
  resultCount,
  totalCount,
  className,
  preserveParams,
  hiddenFields = [],
}: DashboardFilterBarProps) {
  const active = hasActiveListFilters(values);

  return (
    <Card className={cn(className)}>
      <CardContent className="p-4">
        <form
          method="get"
          action={pathname}
          className="flex flex-wrap items-end gap-3"
        >
          {showSearch ? (
            <div className="min-w-[220px] flex-1">
              <Label htmlFor="dashboard-filter-q" className="text-xs text-muted">
                بحث
              </Label>
              <div className="relative mt-1">
                <Search
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <Input
                  id="dashboard-filter-q"
                  name="q"
                  defaultValue={values.q ?? ""}
                  placeholder={searchPlaceholder}
                  className="ps-9"
                />
              </div>
            </div>
          ) : null}

          {hiddenFields.map((key) => {
            const value = preserveParams?.[key];
            if (!value) return null;
            return <input key={key} type="hidden" name={key} value={value} />;
          })}

          {selects.map((field) => (
            <div key={field.name} className="min-w-[180px]">
              <Label
                htmlFor={`dashboard-filter-${field.name}`}
                className="text-xs text-muted"
              >
                {field.label}
              </Label>
              <div className="mt-1">
                <IconSelect
                  id={`dashboard-filter-${field.name}`}
                  name={field.name}
                  options={buildFilterSelectOptions(
                    field.name,
                    field.options,
                    {
                      allLabel: field.allLabel,
                      hideAllOption: field.hideAllOption,
                    },
                  )}
                  defaultValue={
                    (values[field.name as keyof ListFilterParams] as string) ??
                    (field.hideAllOption
                      ? field.options[0]?.value
                      : "all")
                  }
                />
              </div>
            </div>
          ))}

          <Button type="submit" className="h-11">
            تصفية
          </Button>

          {active ? (
            <Link
              href={pathname}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-medium text-muted transition-colors hover:bg-primary/5 hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
              مسح
            </Link>
          ) : null}
        </form>

        {resultCount !== undefined && totalCount !== undefined ? (
          <p className="mt-3 text-xs text-muted">
            {active
              ? `عرض ${resultCount} من ${totalCount} نتيجة`
              : `${totalCount} عنصر`}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
