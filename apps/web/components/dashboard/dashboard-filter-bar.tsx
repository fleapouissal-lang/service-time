"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { FilterToggleButton } from "@/components/dashboard/filter-toggle-button";
import { Card, CardContent } from "@/components/ui/card";
import { IconSelect } from "@/components/ui/icon-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasActiveListFilters, type ListFilterParams } from "@/lib/list-filters";
import { buildFilterSelectOptions } from "@/lib/i18n/labels";
import { useLocale } from "@/lib/i18n/locale-context";
import { requestFieldShellClass } from "@/lib/request-styles";
import { cn } from "@/lib/utils";

export type DashboardFilterSelect = {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  allLabel?: string;
  hideAllOption?: boolean;
  /** Other query keys cleared when this select changes. */
  clearOnChange?: string[];
  /** Force remount when dependency changes (e.g. vehicle model after brand). */
  remountKey?: string;
  /** Override displayed value (when not taken from `values[name]`). */
  currentValue?: string;
  /** Map a selected value to one or more query params. */
  resolveParams?: (
    value: string,
  ) => Record<string, string | undefined>;
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
  /** When true, the filter bar is only visible below the `lg` breakpoint. */
  mobileOnly?: boolean;
  /** Keep search, selects, and actions on one row from `md` up. */
  singleRow?: boolean;
  /** Apply filters on select/search change (no Filter button). */
  autoSubmit?: boolean;
  /** No card background, border, or shadow. */
  plain?: boolean;
  /** Custom clear link (defaults to pathname + preserved hidden fields). */
  clearHref?: string;
  children?: ReactNode;
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
  mobileOnly = false,
  singleRow = false,
  autoSubmit = false,
  plain = false,
  clearHref,
  children,
}: DashboardFilterBarProps) {
  const { messages: t } = useLocale();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(values.q ?? "");
  const skipNextSearch = useRef(false);
  const active = hasActiveListFilters(values);
  const resolvedPlaceholder = searchPlaceholder ?? t.common.search;

  useEffect(() => {
    skipNextSearch.current = true;
    setQuery(values.q ?? "");
  }, [values.q]);

  const countText =
    resultCount !== undefined && totalCount !== undefined
      ? active
        ? t.common.resultCount
            .replace("{count}", String(resultCount))
            .replace("{total}", String(totalCount))
        : t.common.itemCount.replace("{count}", String(totalCount))
      : null;

  function buildHref(
    patch: Record<string, string | undefined>,
    clearKeys: string[] = [],
  ) {
    const params = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      ...values,
      ...preserveParams,
    };

    if (showSearch) {
      base.q = query.trim() || undefined;
    }

    Object.assign(base, patch);

    for (const key of clearKeys) {
      delete base[key];
    }

    for (const key of hiddenFields) {
      const preserved = preserveParams?.[key];
      if (preserved) base[key] = preserved;
    }

    for (const [key, value] of Object.entries(base)) {
      if (!value || value === "all") continue;
      params.set(key, value);
    }

    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function navigate(
    patch: Record<string, string | undefined>,
    clearKeys: string[] = [],
  ) {
    const href = buildHref(patch, clearKeys);
    startTransition(() => {
      router.push(href);
    });
  }

  useEffect(() => {
    if (!autoSubmit || !showSearch) return;
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const current = values.q ?? "";
    if (query.trim() === current.trim()) return;

    const timer = window.setTimeout(() => {
      navigate({ q: query.trim() || undefined });
    }, 350);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- navigate uses latest query/values
  }, [autoSubmit, query, showSearch, values.q]);

  const clearParams = hiddenFields
    .map((key) => {
      const value = preserveParams?.[key];
      return value && value !== "all" ? ([key, value] as const) : null;
    })
    .filter(Boolean)
    .reduce((params, entry) => {
      if (!entry) return params;
      params.set(entry[0], entry[1]);
      return params;
    }, new URLSearchParams());

  const clearUrl =
    clearHref ??
    (clearParams.toString()
      ? `${pathname}?${clearParams.toString()}`
      : pathname);

  return (
    <Card
      className={cn(
        mobileOnly && "lg:hidden",
        className,
        pending && "opacity-90",
        plain
          ? "border-0 bg-transparent shadow-none ring-0"
          : [
              !mobileOpen &&
                "border-0 bg-transparent shadow-none lg:border lg:bg-card lg:shadow-sm",
              mobileOnly &&
                !mobileOpen &&
                "border-0 bg-transparent shadow-none",
            ],
      )}
    >
      <CardContent
        className={cn(
          plain
            ? mobileOpen
              ? "p-4"
              : "p-0"
            : mobileOpen
              ? "p-4"
              : "p-0 lg:p-4",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 lg:hidden",
            mobileOpen ? "mb-3 justify-end" : "justify-between",
          )}
        >
          {!mobileOpen && countText ? (
            <p className="min-w-0 flex-1 text-xs text-muted">{countText}</p>
          ) : null}
          <FilterToggleButton
            open={mobileOpen}
            onToggle={() => setMobileOpen((value) => !value)}
            active={active}
            text={t.common.filtering}
            showLabel={t.common.showFilters}
            hideLabel={t.common.hideFilters}
          />
        </div>

        <div
          className={cn(
            !mobileOpen &&
              (mobileOnly ? "hidden" : "hidden lg:block"),
          )}
        >
          <form
            method="get"
            action={pathname}
            onSubmit={(event) => {
              if (!autoSubmit) return;
              event.preventDefault();
              navigate({ q: query.trim() || undefined });
            }}
            className={cn(
              singleRow
                ? "flex flex-col gap-3 md:flex-row md:items-end md:gap-3"
                : "grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(auto-fit,minmax(11rem,1fr))_auto] xl:items-end",
            )}
          >
            {showSearch ? (
              <div
                className={cn(
                  "min-w-0",
                  singleRow ? "md:min-w-[12rem] md:flex-1" : "sm:col-span-2 xl:col-span-1",
                )}
              >
                <Label htmlFor="dashboard-filter-q" className="text-xs font-medium text-muted">
                  {t.common.search}
                </Label>
                <div className="relative mt-1.5">
                  <Search
                    className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                    aria-hidden
                  />
                  <Input
                    id="dashboard-filter-q"
                    name="q"
                    value={autoSubmit ? query : undefined}
                    defaultValue={autoSubmit ? undefined : values.q ?? ""}
                    onChange={
                      autoSubmit
                        ? (event) => setQuery(event.target.value)
                        : undefined
                    }
                    placeholder={resolvedPlaceholder}
                    className={cn(
                      "h-11 rounded-xl ps-9 shadow-none",
                      "border-[color:var(--request-field-border)] bg-[color:var(--request-field-bg)]",
                      "hover:border-[color:var(--request-field-hover-border)]",
                      "focus-visible:border-[color:var(--request-field-focus-border)]",
                      "focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_var(--request-field-focus-ring)]",
                      requestFieldShellClass,
                    )}
                  />
                </div>
              </div>
            ) : null}

            {!autoSubmit
              ? hiddenFields.map((key) => {
                  const value = preserveParams?.[key];
                  if (!value) return null;
                  return <input key={key} type="hidden" name={key} value={value} />;
                })
              : null}

            {selects.map((field) => {
              const selectOptions = buildFilterSelectOptions(
                t,
                field.name,
                field.options,
                {
                  allLabel: field.allLabel,
                  hideAllOption: field.hideAllOption,
                },
              );
              const rawValue =
                field.currentValue ??
                (values[field.name as keyof ListFilterParams] as
                  | string
                  | undefined);
              const fallbackValue = field.hideAllOption
                ? (field.options[0]?.value ?? selectOptions[0]?.value ?? "")
                : "all";
              const selectValue =
                rawValue && selectOptions.some((option) => option.value === rawValue)
                  ? rawValue
                  : fallbackValue;

              return (
                <div
                  key={field.name}
                  className={cn(
                    "min-w-0",
                    singleRow && "md:w-[11.5rem] md:shrink-0 lg:w-[12.5rem]",
                  )}
                >
                  <Label
                    htmlFor={`dashboard-filter-${field.name}`}
                    className="text-xs font-medium text-muted"
                  >
                    {field.label}
                  </Label>
                  <div className="mt-1.5">
                    <IconSelect
                      key={field.remountKey ?? field.name}
                      id={`dashboard-filter-${field.name}`}
                      name={
                        autoSubmit || field.resolveParams
                          ? undefined
                          : field.name
                      }
                      options={selectOptions}
                      fallbackIcon={
                        field.name.startsWith("vehicle_") ||
                        field.name === "client_vehicle"
                          ? "car"
                          : "circle"
                      }
                      value={autoSubmit ? selectValue : undefined}
                      defaultValue={autoSubmit ? undefined : selectValue}
                      onValueChange={
                        autoSubmit
                          ? (next) => {
                              if (field.resolveParams) {
                                navigate(
                                  field.resolveParams(next),
                                  field.clearOnChange ?? [],
                                );
                                return;
                              }
                              navigate(
                                {
                                  [field.name]:
                                    next === "all" ? undefined : next,
                                },
                                field.clearOnChange ?? [],
                              );
                            }
                          : undefined
                      }
                    />
                  </div>
                </div>
              );
            })}

            {children}

            {active || !autoSubmit ? (
              <div
                className={cn(
                  "flex flex-wrap items-center gap-2",
                  singleRow
                    ? "md:shrink-0 md:justify-end"
                    : "sm:col-span-2 xl:col-span-1 xl:justify-end",
                )}
              >
                {!autoSubmit ? (
                  <button
                    type="submit"
                    className="inline-flex h-11 min-w-[7.5rem] shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {t.common.filter}
                  </button>
                ) : null}

                {active ? (
                  <Link
                    href={clearUrl}
                    className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-4 text-sm font-medium text-muted transition-colors hover:bg-primary/5 hover:text-foreground"
                  >
                    <X className="size-4" aria-hidden />
                    {t.common.clear}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </form>

          {countText ? (
            <p className="mt-3 text-xs text-muted">{countText}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
