import type { ServiceRequest } from "@service-time/types";
import type { TrendDatum } from "@/lib/dashboard-analytics";
import type { Locale } from "@/lib/i18n/config";
import { getIntlLocale } from "@/lib/i18n/config";

export type OverviewPeriod = "today" | "month" | "year";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function normalizeOverviewPeriod(period?: string): OverviewPeriod {
  if (period === "today" || period === "month" || period === "year") {
    return period;
  }
  return "month";
}

export function isInOverviewPeriod(
  createdAt: string,
  period: OverviewPeriod,
): boolean {
  const created = new Date(createdAt);
  const now = new Date();

  if (period === "today") {
    return startOfDay(created).getTime() === startOfDay(now).getTime();
  }

  if (period === "month") {
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth()
    );
  }

  return created.getFullYear() === now.getFullYear();
}

export function filterByOverviewPeriod(
  requests: ServiceRequest[],
  period: OverviewPeriod,
): ServiceRequest[] {
  return requests.filter((r) => isInOverviewPeriod(r.created_at, period));
}

export function buildOverviewTrend(
  requests: ServiceRequest[],
  period: OverviewPeriod,
  locale: Locale,
): TrendDatum[] {
  const intlLocale = getIntlLocale(locale);
  const now = new Date();

  if (period === "today") {
    const today = startOfDay(now);
    return Array.from({ length: 24 }, (_, hour) => {
      const bucketStart = new Date(today);
      bucketStart.setHours(hour, 0, 0, 0);
      const bucketEnd = new Date(today);
      bucketEnd.setHours(hour + 1, 0, 0, 0);

      const count = requests.filter((r) => {
        const created = new Date(r.created_at);
        return created >= bucketStart && created < bucketEnd;
      }).length;

      return {
        date: `${String(hour).padStart(2, "0")}:00`,
        count,
      };
    });
  }

  if (period === "month") {
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = now.getDate();
    const result: TrendDatum[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const start = new Date(year, month, day);
      const end = new Date(year, month, day + 1);
      const count = requests.filter((r) => {
        const created = new Date(r.created_at);
        return created >= start && created < end;
      }).length;

      result.push({
        date: start.toLocaleDateString(intlLocale, {
          day: "numeric",
          month: "short",
        }),
        count,
      });
    }

    return result;
  }

  const year = now.getFullYear();
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 1);
    const count = requests.filter((r) => {
      const created = new Date(r.created_at);
      return created >= start && created < end;
    }).length;

    return {
      date: start.toLocaleDateString(intlLocale, { month: "short" }),
      count,
    };
  });
}

export function parseOverviewFilters(
  searchParams: Record<string, string | undefined>,
) {
  const period = normalizeOverviewPeriod(searchParams.period);
  return {
    q: searchParams.q?.trim() || undefined,
    status: searchParams.status?.trim() || undefined,
    priority: searchParams.priority?.trim() || undefined,
    service_type: searchParams.service_type?.trim() || undefined,
    period,
  };
}

export type OverviewFilterParams = ReturnType<typeof parseOverviewFilters>;

export function filterOverviewOrders(
  items: ServiceRequest[],
  params: OverviewFilterParams,
): ServiceRequest[] {
  let result = filterByOverviewPeriod(items, params.period);

  if (params.q) {
    const q = params.q.toLowerCase();
    result = result.filter(
      (item) =>
        item.customer_name.toLowerCase().includes(q) ||
        (item.customer_phone?.toLowerCase().includes(q) ?? false) ||
        (item.car_type?.toLowerCase().includes(q) ?? false) ||
        (item.location_text?.toLowerCase().includes(q) ?? false) ||
        item.tracking_token.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false),
    );
  }

  if (params.status && params.status !== "all") {
    result = result.filter((item) => item.status === params.status);
  }

  if (params.priority && params.priority !== "all") {
    result = result.filter((item) => item.priority === params.priority);
  }

  if (params.service_type && params.service_type !== "all") {
    result = result.filter((item) => item.service_type === params.service_type);
  }

  return result;
}

export function hasOverviewFilters(params: OverviewFilterParams): boolean {
  return Boolean(
    params.q ||
      (params.status && params.status !== "all") ||
      (params.priority && params.priority !== "all") ||
      (params.service_type && params.service_type !== "all"),
  );
}

export type ChartPeriodKey =
  | "status"
  | "trend"
  | "service"
  | "priority"
  | "insights";

export const CHART_PERIOD_PARAM_KEYS: Record<ChartPeriodKey, string> = {
  status: "status_period",
  trend: "trend_period",
  service: "service_period",
  priority: "priority_period",
  insights: "insights_period",
};

export const ALL_CHART_PERIOD_PARAM_KEYS = Object.values(
  CHART_PERIOD_PARAM_KEYS,
);

export function getChartPeriodParamKey(key: ChartPeriodKey): string {
  return CHART_PERIOD_PARAM_KEYS[key];
}

export function getChartPeriod(
  searchParams: Record<string, string | undefined>,
  key: ChartPeriodKey,
  fallback: OverviewPeriod = "month",
): OverviewPeriod {
  const paramKey = getChartPeriodParamKey(key);
  const raw = searchParams[paramKey];
  if (raw === "today" || raw === "month" || raw === "year") {
    return raw;
  }
  if (searchParams.period) {
    return normalizeOverviewPeriod(searchParams.period);
  }
  return fallback;
}

export function buildOverviewHref(
  pathname: string,
  updates: Record<string, string | undefined>,
  preserveParams?: Record<string, string | undefined>,
) {
  const sp = new URLSearchParams();
  const merged = { ...(preserveParams ?? {}), ...updates };

  for (const [key, value] of Object.entries(merged)) {
    if (!value || value === "all") continue;
    sp.set(key, value);
  }

  const qs = sp.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function filterOrdersWithPeriod(
  items: ServiceRequest[],
  params: OverviewFilterParams,
  period: OverviewPeriod,
): ServiceRequest[] {
  return filterOverviewOrders(items, { ...params, period });
}
