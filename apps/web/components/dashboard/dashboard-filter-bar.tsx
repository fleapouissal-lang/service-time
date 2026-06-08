"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconSelect } from "@/components/ui/icon-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasActiveListFilters, type ListFilterParams } from "@/lib/list-filters";
import { buildFilterSelectOptions } from "@/lib/i18n/labels";
import { useLocale } from "@/lib/i18n/locale-context";
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
  searchPlaceholder,
  showSearch = true,
  resultCount,
  totalCount,
  className,
  preserveParams,
  hiddenFields = [],
}: DashboardFilterBarProps) {
  const { messages: t } = useLocale();
  const active = hasActiveListFilters(values);
  const resolvedPlaceholder = searchPlaceholder ?? t.common.search;
  const selectCount = selects.length;
  const compactFilters = !showSearch && selectCount > 0 && selectCount <= 2;
  const inlineFilterRow =
    (showSearch && selectCount <= 2) || compactFilters;

  return (
    <Card className={cn(className)}>
      <CardContent className="p-4">
        <form
          method="get"
          action={pathname}
          className={cn(
            "items-end gap-3",
            inlineFilterRow
              ? "flex flex-wrap"
              : cn(
                  "grid sm:grid-cols-2 lg:grid-cols-3",
                  showSearch &&
                    selectCount > 0 &&
                    "xl:grid-cols-[minmax(220px,1.2fr)_repeat(auto-fit,minmax(180px,1fr))]",
                ),
          )}
        >
          {showSearch ? (
            <div
              className={cn(
                "min-w-0",
                inlineFilterRow
                  ? "min-w-[220px] flex-[2_1_320px]"
                  : selectCount > 0
                    ? "sm:col-span-2 xl:col-span-1"
                    : "sm:col-span-2 lg:col-span-1",
              )}
            >
              <Label htmlFor="dashboard-filter-q" className="text-xs text-muted">
                {t.common.search}
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
                  placeholder={resolvedPlaceholder}
                  className="h-11 ps-9"
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
            <div
              key={field.name}
              className={cn(
                "min-w-0",
                inlineFilterRow && "min-w-[180px] flex-1",
              )}
            >
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
                  options={buildFilterSelectOptions(t, field.name, field.options, {
                    allLabel: field.allLabel,
                    hideAllOption: field.hideAllOption,
                  })}
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

          <div
            className={cn(
              "flex min-w-0 shrink-0 flex-col",
              !inlineFilterRow &&
                (showSearch && selectCount > 0
                  ? "sm:col-span-2 xl:col-span-full xl:justify-self-start"
                  : "sm:col-span-2 lg:col-span-1 lg:justify-self-start"),
            )}
          >
            <Label
              aria-hidden
              className="pointer-events-none text-xs text-transparent select-none"
            >
              {t.common.filter}
            </Label>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Button type="submit" className="h-11 shrink-0">
                {t.common.filter}
              </Button>

              {active ? (
                <Link
                  href={pathname}
                  className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-medium text-muted transition-colors hover:bg-primary/5 hover:text-foreground"
                >
                  <X className="size-4" aria-hidden />
                  {t.common.clear}
                </Link>
              ) : null}
            </div>
          </div>
        </form>

        {resultCount !== undefined && totalCount !== undefined ? (
          <p className="mt-3 text-xs text-muted">
            {active
              ? t.common.resultCount
                  .replace("{count}", String(resultCount))
                  .replace("{total}", String(totalCount))
              : t.common.itemCount.replace("{count}", String(totalCount))}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
