"use client";

import Link from "next/link";
import {
  ADMIN_ORDER_SECTIONS,
  type AdminOrderPricingPath,
  type AdminOrderSectionId,
} from "@/lib/admin-order-sections";
import { cn } from "@/lib/utils";

export type AdminOrderSectionTabLabels = Record<
  AdminOrderSectionId,
  string
> & {
  pricingPaths: Record<AdminOrderPricingPath, string>;
  needsAction: string;
  total: string;
};

type AdminOrderSectionTabsProps = {
  activeSection: AdminOrderSectionId;
  counts: Partial<Record<AdminOrderSectionId, number>>;
  actionCounts: Partial<Record<AdminOrderSectionId, number>>;
  labels: AdminOrderSectionTabLabels;
  /** Extra query params to preserve (status, q, period…). */
  preserveParams?: Record<string, string | undefined>;
};

function buildHref(
  section: AdminOrderSectionId,
  preserveParams?: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  if (section !== "all") params.set("section", section);
  if (preserveParams) {
    for (const [key, value] of Object.entries(preserveParams)) {
      if (!value || value === "all") continue;
      if (key === "section") continue;
      params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

export function AdminOrderSectionTabs({
  activeSection,
  counts,
  actionCounts,
  labels,
  preserveParams,
}: AdminOrderSectionTabsProps) {
  return (
    <div className="space-y-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {ADMIN_ORDER_SECTIONS.map((section) => {
          const active = activeSection === section.id;
          const total = counts[section.id] ?? 0;
          const action = actionCounts[section.id] ?? 0;
          return (
            <Link
              key={section.id}
              href={buildHref(section.id, preserveParams)}
              className={cn(
                "inline-flex min-w-max flex-col gap-1 rounded-2xl border px-3.5 py-2.5 transition-colors",
                active
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border/70 bg-card/60 text-muted hover:border-primary/25 hover:bg-card hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                {labels[section.id]}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums",
                    active
                      ? "bg-primary/20 text-primary"
                      : "bg-muted/40 text-muted",
                  )}
                >
                  {total}
                </span>
                {action > 0 ? (
                  <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-amber-700 dark:text-amber-300">
                    {action}
                  </span>
                ) : null}
              </span>
              {section.id !== "all" ? (
                <span className="text-[11px] leading-snug opacity-80">
                  {labels.pricingPaths[section.pricingPath]}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
      {actionCounts[activeSection] && actionCounts[activeSection]! > 0 ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          {labels.needsAction}: {actionCounts[activeSection]} · {labels.total}:{" "}
          {counts[activeSection] ?? 0}
        </p>
      ) : null}
    </div>
  );
}
