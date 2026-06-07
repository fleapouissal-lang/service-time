import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Wrench,
} from "lucide-react";
import { ChartPeriodTabs } from "@/components/dashboard/chart-period-tabs";
import {
  KpiInsightsCard,
  StatusDonutChart,
  WeeklyTrendChart,
} from "@/components/dashboard/dashboard-charts";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getOrderSearchPlaceholder,
  getPriorityFilterOptionsForDashboard,
  getStatusFilterOptionsForDashboard,
} from "@/lib/dashboard-filter-options";
import {
  buildDashboardKpis,
  buildStatusChartData,
} from "@/lib/dashboard-analytics";
import { requireProfile } from "@/lib/auth";
import { getTechnicianRequests } from "@/lib/dashboard-queries";
import {
  getExecutionMethodLabels,
  getOverviewPeriodLabel,
  getOverviewPeriodOptions,
  getOverviewTrendTitle,
  getServiceTypeLabels,
  getStatusLabels,
} from "@/lib/i18n/labels";
import { getServerI18n } from "@/lib/i18n/server";
import {
  ALL_CHART_PERIOD_PARAM_KEYS,
  buildOverviewTrend,
  filterByOverviewPeriod,
  filterOrdersWithPeriod,
  filterOverviewOrders,
  getChartPeriod,
  getChartPeriodParamKey,
  parseOverviewFilters,
} from "@/lib/overview-period";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function TechnicianHomePage({ searchParams }: PageProps) {
  const { t, locale } = await getServerI18n();
  const profile = await requireProfile(["technician"]);
  if (!profile) return null;

  const rawParams = await searchParams;
  const params = parseOverviewFilters(rawParams);
  const allOrders = await getTechnicianRequests(profile.id);
  const periodOrders = filterByOverviewPeriod(allOrders, params.period);
  const orders = filterOverviewOrders(allOrders, params);
  const kpis = buildDashboardKpis(orders);
  const periodLabel = getOverviewPeriodLabel(t, params.period);
  const statusLabels = getStatusLabels(t);
  const serviceTypeLabels = getServiceTypeLabels(t);
  const executionMethodLabels = getExecutionMethodLabels(t);
  const inProgress =
    (kpis.byStatus.in_progress ?? 0) +
    (kpis.byStatus.on_the_way ?? 0) +
    (kpis.byStatus.arrived ?? 0);

  const statusPeriod = getChartPeriod(rawParams, "status");
  const trendPeriod = getChartPeriod(rawParams, "trend");
  const insightsPeriod = getChartPeriod(rawParams, "insights");

  const statusOrders = filterOrdersWithPeriod(allOrders, params, statusPeriod);
  const trendOrders = filterOrdersWithPeriod(allOrders, params, trendPeriod);
  const insightsOrders = filterOrdersWithPeriod(
    allOrders,
    params,
    insightsPeriod,
  );
  const insightsKpis = buildDashboardKpis(insightsOrders);

  const chartTabs = (
    key: "status" | "trend" | "insights",
    period: typeof statusPeriod,
  ) => (
    <ChartPeriodTabs
      pathname="/technician"
      paramKey={getChartPeriodParamKey(key)}
      active={period}
      preserveParams={rawParams}
    />
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard.technician.title}</h1>
        <p className="text-muted">
          {t.dashboard.technician.subtitle} — {periodLabel}
        </p>
      </div>

      <DashboardFilterBar
        pathname="/technician"
        values={params}
        preserveParams={rawParams}
        hiddenFields={ALL_CHART_PERIOD_PARAM_KEYS}
        searchPlaceholder={getOrderSearchPlaceholder(t)}
        selects={[
          {
            name: "period",
            label: t.dashboard.common.statisticsPeriod,
            options: getOverviewPeriodOptions(t).map((o) => ({
              value: o.value,
              label: o.label,
            })),
            hideAllOption: true,
          },
          {
            name: "status",
            label: t.common.status,
            options: getStatusFilterOptionsForDashboard(t),
          },
          {
            name: "priority",
            label: t.common.priority,
            options: getPriorityFilterOptionsForDashboard(t),
          },
        ]}
        resultCount={orders.length}
        totalCount={periodOrders.length}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label={t.dashboard.technician.totalAssigned}
          value={kpis.total}
          hint={periodLabel}
          icon={ClipboardList}
        />
        <StatCard
          label={t.dashboard.technician.active}
          value={kpis.active}
          hint={t.dashboard.technician.activeHint}
          icon={Wrench}
          accent
        />
        <StatCard
          label={t.dashboard.technician.inProgress}
          value={inProgress}
          icon={Clock}
          accent
        />
        <StatCard
          label={t.dashboard.technician.highPriority}
          value={kpis.highPriority}
          icon={AlertTriangle}
          accent
        />
        <StatCard
          label={t.dashboard.technician.completed}
          value={kpis.completed}
          hint={periodLabel}
          icon={CheckCircle2}
          accent
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatusDonutChart
          data={buildStatusChartData(t, statusOrders)}
          title={t.dashboard.charts.myOrdersDistribution}
          headerAction={chartTabs("status", statusPeriod)}
        />
        <WeeklyTrendChart
          data={buildOverviewTrend(trendOrders, trendPeriod, locale)}
          title={getOverviewTrendTitle(t, trendPeriod)}
          headerAction={chartTabs("trend", trendPeriod)}
        />
        <KpiInsightsCard
          title={t.dashboard.charts.quickInsights}
          headerAction={chartTabs("insights", insightsPeriod)}
          items={[
            { label: t.dashboard.technician.insights.received, value: insightsKpis.byStatus.received ?? 0 },
            { label: t.dashboard.technician.insights.arrived, value: insightsKpis.byStatus.arrived ?? 0 },
            { label: t.dashboard.technician.insights.completed, value: insightsKpis.completed },
            { label: t.dashboard.technician.insights.cancelled, value: insightsKpis.cancelled },
          ]}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {t.dashboard.technician.myOrdersPeriod} — {periodLabel}
            </h2>
            <Link
              href="/technician/location"
              className="text-sm font-semibold text-primary"
            >
              {t.dashboard.technician.location}
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="text-sm text-muted">
              {periodOrders.length === 0
                ? `${t.dashboard.technician.noOrdersInPeriod} ${periodLabel}.`
                : t.common.noResultsFiltered}
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4"
                >
                  <div>
                    <p className="font-semibold">{order.customer_name}</p>
                    <p className="text-sm text-muted">
                      {serviceTypeLabels[order.service_type]} ·{" "}
                      {executionMethodLabels[order.execution_method]}
                    </p>
                    <p className="mt-1 text-sm">
                      {order.location_text ?? t.common.dash}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      {
                        statusLabels[
                          order.status as keyof typeof statusLabels
                        ]
                      }
                    </Badge>
                    <Link
                      href={`/technician/orders/${order.id}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      {t.common.manage}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

