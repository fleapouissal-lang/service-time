import Link from "next/link";
import {
  buildOverviewHref,
  type OverviewPeriod,
  OVERVIEW_PERIOD_OPTIONS,
} from "@/lib/overview-period";
import { cn } from "@/lib/utils";

type OverviewPeriodTabsProps = {
  pathname: string;
  active: OverviewPeriod;
  preserveParams?: Record<string, string | undefined>;
};

export function OverviewPeriodTabs({
  pathname,
  active,
  preserveParams,
}: OverviewPeriodTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {OVERVIEW_PERIOD_OPTIONS.map((tab) => (
        <Link
          key={tab.value}
          href={buildOverviewHref(pathname, { period: tab.value }, preserveParams)}
          className={cn(
            "inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold transition-colors",
            active === tab.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-border bg-card hover:bg-primary/5",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
