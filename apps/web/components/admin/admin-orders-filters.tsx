"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { IconSelect } from "@/components/ui/icon-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADMIN_ORDER_SECTION_IDS,
  type AdminOrderSectionId,
} from "@/lib/admin-order-sections";
import { buildFilterSelectOptions } from "@/lib/i18n/labels";
import { useLocale } from "@/lib/i18n/locale-context";
import type { ListFilterParams } from "@/lib/list-filters";
import { requestFieldShellClass } from "@/lib/request-styles";
import { cn } from "@/lib/utils";

type SelectField = {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  allLabel?: string;
};

type AdminOrdersFiltersProps = {
  values: ListFilterParams;
  section: AdminOrderSectionId;
  sectionLabels: Record<AdminOrderSectionId, string>;
  statusOptions: { value: string; label: string }[];
  priorityOptions: { value: string; label: string }[];
  periodOptions: { value: string; label: string }[];
  isSpareSection?: boolean;
  searchPlaceholder: string;
  requestTypeLabel: string;
  needsActionLabel: string;
  needsActionOptionLabel: string;
  showMoreLabel: string;
  showLessLabel: string;
  resultCount?: number;
  totalCount?: number;
};

export function AdminOrdersFilters({
  values,
  section,
  sectionLabels,
  statusOptions,
  priorityOptions,
  periodOptions,
  isSpareSection = false,
  searchPlaceholder,
  requestTypeLabel,
  needsActionLabel,
  needsActionOptionLabel,
  showMoreLabel,
  showLessLabel,
  resultCount,
  totalCount,
}: AdminOrdersFiltersProps) {
  const { messages: t } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(values.q ?? "");

  const hasSecondaryFilters = Boolean(
    (values.q && values.q.trim()) ||
      (values.period && values.period !== "all") ||
      values.needs_action === "1" ||
      values.needs_action === "true",
  );
  const [expanded, setExpanded] = useState(hasSecondaryFilters);

  useEffect(() => {
    setQuery(values.q ?? "");
  }, [values.q]);

  useEffect(() => {
    if (hasSecondaryFilters) setExpanded(true);
  }, [hasSecondaryFilters]);

  const activePrimary = Boolean(
    (section && section !== "all") ||
      (values.status && values.status !== "all") ||
      (values.priority && values.priority !== "all"),
  );
  const active = activePrimary || hasSecondaryFilters;

  const countText =
    resultCount !== undefined && totalCount !== undefined
      ? active
        ? t.common.resultCount
            .replace("{count}", String(resultCount))
            .replace("{total}", String(totalCount))
        : t.common.itemCount.replace("{count}", String(totalCount))
      : null;

  function buildHref(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      section: section === "all" ? undefined : section,
      status: values.status,
      priority: values.priority,
      period: values.period,
      needs_action: values.needs_action,
      q: query.trim() || undefined,
      ...patch,
    };

    for (const [key, value] of Object.entries(base)) {
      if (!value || value === "all") continue;
      params.set(key, value);
    }

    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  }

  function navigate(patch: Record<string, string | undefined>) {
    startTransition(() => {
      router.push(buildHref(patch));
    });
  }

  const sectionOptions = ADMIN_ORDER_SECTION_IDS.filter((id) => id !== "all").map(
    (id) => ({
      value: id,
      label: sectionLabels[id],
    }),
  );

  const primarySelects: SelectField[] = [
    {
      name: "section",
      label: requestTypeLabel,
      options: sectionOptions,
      allLabel: sectionLabels.all,
    },
    {
      name: "status",
      label: t.common.status,
      options: statusOptions,
    },
    ...(!isSpareSection
      ? [
          {
            name: "priority",
            label: t.common.priority,
            options: priorityOptions,
          } satisfies SelectField,
        ]
      : []),
  ];

  const secondarySelects: SelectField[] = [
    {
      name: "period",
      label: t.common.period,
      options: periodOptions,
    },
    {
      name: "needs_action",
      label: needsActionLabel,
      options: [{ value: "1", label: needsActionOptionLabel }],
    },
  ];

  function renderSelect(field: SelectField, className?: string) {
    const selectOptions = buildFilterSelectOptions(t, field.name, field.options, {
      allLabel: field.allLabel,
    });
    const rawValue =
      field.name === "section"
        ? section
        : (values[field.name as keyof ListFilterParams] as string | undefined);
    const selectValue =
      rawValue && selectOptions.some((option) => option.value === rawValue)
        ? rawValue
        : "all";

    return (
      <div key={field.name} className={cn("min-w-0 flex-1", className)}>
        <Label
          htmlFor={`admin-orders-filter-${field.name}`}
          className="text-xs font-medium text-muted"
        >
          {field.label}
        </Label>
        <div className="mt-1.5">
          <IconSelect
            id={`admin-orders-filter-${field.name}`}
            options={selectOptions}
            fallbackIcon="circle"
            value={selectValue}
            onValueChange={(next) => {
              navigate({
                [field.name]: next === "all" ? undefined : next,
              });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <Card className={cn(pending && "opacity-90")}>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {primarySelects.map((field) => renderSelect(field))}
          <div className="flex shrink-0 items-end gap-2 pb-0.5">
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-sm font-medium text-muted transition-colors hover:bg-primary/5 hover:text-foreground"
              aria-expanded={expanded}
            >
              {expanded ? (
                <ChevronUp className="size-4" aria-hidden />
              ) : (
                <ChevronDown className="size-4" aria-hidden />
              )}
              {expanded ? showLessLabel : showMoreLabel}
            </button>
            {active ? (
              <Link
                href="/admin/orders"
                className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-sm font-medium text-muted transition-colors hover:bg-primary/5 hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
                {t.common.clear}
              </Link>
            ) : null}
          </div>
        </div>

        {expanded ? (
          <div className="flex flex-col gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-[1.4]">
              <Label
                htmlFor="admin-orders-filter-q"
                className="text-xs font-medium text-muted"
              >
                {t.common.search}
              </Label>
              <div className="relative mt-1.5">
                <Search
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <Input
                  id="admin-orders-filter-q"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      navigate({ q: query.trim() || undefined });
                    }
                  }}
                  onBlur={() => {
                    const next = query.trim() || undefined;
                    const current = values.q?.trim() || undefined;
                    if (next !== current) {
                      navigate({ q: next });
                    }
                  }}
                  placeholder={searchPlaceholder}
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
            {secondarySelects.map((field) =>
              renderSelect(field, "sm:max-w-[14rem]"),
            )}
          </div>
        ) : null}

        {countText ? (
          <p className="text-xs text-muted">{countText}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
