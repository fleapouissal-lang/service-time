import type { LucideIcon } from "lucide-react";
import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AdminReportsHeaderProps = {
  title: string;
  subtitle: string;
  periodLabel: string;
  periodCaption: string;
  matchingCaption: string;
  matchingCount: number;
  totalCount: number;
  updatedCaption: string;
};

export function AdminReportsHeader({
  title,
  subtitle,
  periodLabel,
  periodCaption,
  matchingCaption,
  matchingCount,
  totalCount,
  updatedCaption,
}: AdminReportsHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-card shadow-[0_8px_32px_rgba(148,212,185,0.06)]">
      <div className="pointer-events-none absolute -end-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-6 p-6 md:p-8">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
            <BarChart3 className="size-6" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted md:text-base">{subtitle}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-lg px-3 py-1">
                {periodCaption}: {periodLabel}
              </Badge>
              <Badge variant="outline" className="rounded-lg px-3 py-1">
                {matchingCaption}:{" "}
                <span dir="ltr" className="ms-1 font-semibold">
                  {matchingCount} / {totalCount}
                </span>
              </Badge>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted">{updatedCaption}</p>
      </div>
    </div>
  );
}

type AdminReportsSummaryStripProps = {
  items: {
    label: string;
    value: string | number;
    icon: LucideIcon;
    accent?: boolean;
  }[];
};

export function AdminReportsSummaryStrip({ items }: AdminReportsSummaryStripProps) {
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-border/80 bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex items-center gap-4 bg-card px-5 py-4"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {item.label}
              </p>
              <p
                className={`mt-0.5 truncate text-2xl font-bold tracking-tight ${
                  item.accent ? "text-primary" : ""
                }`}
                dir="ltr"
              >
                {item.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
