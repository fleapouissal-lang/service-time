import type { ServiceRequest, ServiceType } from "@service-time/types";
import type { Messages } from "@/messages/types";
import type { Locale } from "@/lib/i18n/config";
import { getIntlLocale } from "@/lib/i18n/config";
import {
  getPriorityLabels,
  getServiceTypeLabels,
  getStatusLabels,
} from "@/lib/i18n/labels";

export type ChartDatum = {
  key: string;
  name: string;
  value: number;
};

export type TrendDatum = {
  date: string;
  count: number;
};

export type DashboardKpis = {
  total: number;
  byStatus: Record<string, number>;
  highPriority: number;
  active: number;
  unassigned: number;
  completed: number;
  cancelled: number;
  todayCount: number;
  weekCount: number;
  avgCompletionDays: number | null;
};

const ACTIVE_STATUSES = new Set([
  "received",
  "in_progress",
  "on_the_way",
  "arrived",
]);

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function countByStatus(requests: ServiceRequest[]): Record<string, number> {
  const byStatus: Record<string, number> = {};
  for (const r of requests) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }
  return byStatus;
}

export function buildStatusChartData(
  t: Messages,
  requests: ServiceRequest[],
): ChartDatum[] {
  const byStatus = countByStatus(requests);
  return Object.entries(getStatusLabels(t))
    .map(([key, name]) => ({
      key,
      name,
      value: byStatus[key] ?? 0,
    }))
    .filter((d) => d.value > 0);
}

export function buildServiceTypeChartData(
  t: Messages,
  requests: ServiceRequest[],
): ChartDatum[] {
  const counts: Partial<Record<ServiceType, number>> = {};
  for (const r of requests) {
    counts[r.service_type] = (counts[r.service_type] ?? 0) + 1;
  }
  return Object.entries(getServiceTypeLabels(t))
    .map(([key, name]) => ({
      key,
      name,
      value: counts[key as ServiceType] ?? 0,
    }))
    .filter((d) => d.value > 0);
}

export function buildPriorityChartData(
  t: Messages,
  requests: ServiceRequest[],
): ChartDatum[] {
  const labels = t.labels.priorityChart;
  const counts = { low: 0, normal: 0, high: 0 };
  for (const r of requests) {
    counts[r.priority] += 1;
  }
  return Object.entries(labels).map(([key, name]) => ({
    key,
    name,
    value: counts[key as keyof typeof counts],
  }));
}

export function buildWeeklyTrend(
  requests: ServiceRequest[],
  locale: Locale,
  days = 7,
): TrendDatum[] {
  const intlLocale = getIntlLocale(locale);
  const result: TrendDatum[] = [];
  const today = startOfDay(new Date());

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);

    const count = requests.filter((r) => {
      const created = new Date(r.created_at);
      return created >= day && created < next;
    }).length;

    result.push({
      date: day.toLocaleDateString(intlLocale, {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      count,
    });
  }

  return result;
}

export function computeAvgCompletionDays(
  requests: ServiceRequest[],
): number | null {
  const completed = requests.filter((r) => r.status === "completed");
  if (completed.length === 0) return null;

  const totalDays = completed.reduce((sum, o) => {
    const start = new Date(o.created_at).getTime();
    const end = new Date(o.updated_at).getTime();
    return sum + (end - start) / (1000 * 60 * 60 * 24);
  }, 0);

  return Math.round((totalDays / completed.length) * 10) / 10;
}

export function buildDashboardKpis(requests: ServiceRequest[]): DashboardKpis {
  const byStatus = countByStatus(requests);
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  return {
    total: requests.length,
    byStatus,
    highPriority: requests.filter((r) => r.priority === "high").length,
    active: requests.filter((r) => ACTIVE_STATUSES.has(r.status)).length,
    unassigned: requests.filter(
      (r) => r.status === "received" && !r.assigned_technician_id,
    ).length,
    completed: byStatus.completed ?? 0,
    cancelled: byStatus.cancelled ?? 0,
    todayCount: requests.filter((r) =>
      isSameDay(new Date(r.created_at), now),
    ).length,
    weekCount: requests.filter((r) => new Date(r.created_at) >= weekAgo)
      .length,
    avgCompletionDays: computeAvgCompletionDays(requests),
  };
}
