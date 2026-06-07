import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

type AdminReportsSectionProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
};

export function AdminReportsSection({
  title,
  description,
  icon: Icon,
  actionHref,
  actionLabel,
  children,
}: AdminReportsSectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-card/40 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 bg-muted/15 px-5 py-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {Icon ? (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden />
            </div>
          ) : null}
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-sm text-muted">{description}</p>
            ) : null}
          </div>
        </div>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            {actionLabel}
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        ) : null}
      </div>
      <div className="space-y-6 p-5 md:p-6">{children}</div>
    </section>
  );
}
