import Link from "next/link";
import {
  buildOverviewHref,
  type OverviewPeriod,
  OVERVIEW_PERIOD_OPTIONS,
} from "@/lib/overview-period";
import { cn } from "@/lib/utils";

type ChartPeriodTabsProps = {
  pathname: string;
  paramKey: string;
  active: OverviewPeriod;
  preserveParams?: Record<string, string | undefined>;
};

export function ChartPeriodTabs({
  pathname,
  paramKey,
  active,
  preserveParams,
}: ChartPeriodTabsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {OVERVIEW_PERIOD_OPTIONS.map((tab) => (
        <Link
          key={tab.value}
          href={buildOverviewHref(
            pathname,
            { [paramKey]: tab.value },
            preserveParams,
          )}
          className={cn(
            "inline-flex h-7 items-center rounded-lg px-2.5 text-[11px] font-semibold transition-colors",
            active === tab.value
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-background text-muted hover:bg-primary/5 hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
