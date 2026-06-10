import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Wrench,
} from "lucide-react";
import { ChartPeriodTabs } from "@/components/dashboard/chart-period-tabs";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import {
  KpiInsightsCard,
  StatusDonutChart,
  WeeklyTrendChart,
} from "@/components/dashboard/dashboard-charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { TechnicianLatestOrdersSection } from "@/components/technician/technician-latest-orders-section";
import {
  buildDashboardKpis,
  buildStatusChartData,
} from "@/lib/dashboard-analytics";
import { requireProfile } from "@/lib/auth";
import {
  getRequestStatusHistoryBatch,
  getTechnicianRequests,
} from "@/lib/dashboard-queries";
import {
  getOverviewPeriodLabel,
  getOverviewTrendTitle,
} from "@/lib/i18n/labels";
import { getServerI18n } from "@/lib/i18n/server";
import {
  buildOverviewTrend,
  filterByOverviewPeriod,
  filterOrdersWithPeriod,
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
  const orders = periodOrders;
  const kpis = buildDashboardKpis(orders);
  const periodLabel = getOverviewPeriodLabel(t, params.period);

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
  const latestOrders = [...allOrders]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, 6);
  const historyByOrderId = await getRequestStatusHistoryBatch(
    latestOrders.map((order) => order.id),
  );

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
      <DashboardPageHeader title={t.dashboard.technician.title}>
        <p className="text-muted">
          {t.dashboard.technician.subtitle} — {periodLabel}
        </p>
      </DashboardPageHeader>

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
          value={
            (kpis.byStatus.in_progress ?? 0) +
            (kpis.byStatus.on_the_way ?? 0) +
            (kpis.byStatus.arrived ?? 0)
          }
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

      <TechnicianLatestOrdersSection
        orders={latestOrders}
        historyByOrderId={historyByOrderId}
      />

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
    </div>
  );
}
