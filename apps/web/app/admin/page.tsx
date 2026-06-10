import Link from "next/link";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminOverviewOrdersTable } from "@/components/admin/admin-overview-orders-table";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Shield,
  TrendingUp,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import { ChartPeriodTabs } from "@/components/dashboard/chart-period-tabs";
import {
  KpiInsightsCard,
  PriorityBarChart,
  ServiceTypeBarChart,
  StatusDonutChart,
  WeeklyTrendChart,
} from "@/components/dashboard/dashboard-charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import {
  buildDashboardKpis,
  buildPriorityChartData,
  buildServiceTypeChartData,
  buildStatusChartData,
} from "@/lib/dashboard-analytics";
import {
  buildUserRoleChartData,
  getAdminServiceRequests,
  getUserRoleStats,
} from "@/lib/admin-dashboard-data";
import { getOverviewPeriodLabel, getOverviewTrendTitle, getStatusLabels } from "@/lib/i18n/labels";
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

export default async function AdminHomePage({ searchParams }: PageProps) {
  const { t, locale } = await getServerI18n();
  const rawParams = await searchParams;
  const params = parseOverviewFilters(rawParams);

  const [allOrders, userStats, userChartData] = await Promise.all([
    getAdminServiceRequests(),
    getUserRoleStats(),
    buildUserRoleChartData(),
  ]);

  const periodOrders = filterByOverviewPeriod(allOrders, params.period);
  const orders = periodOrders;
  const kpis = buildDashboardKpis(orders);
  const periodLabel = getOverviewPeriodLabel(t, params.period);
  const statusLabels = getStatusLabels(t);
  const inProgress =
    (kpis.byStatus.in_progress ?? 0) + (kpis.byStatus.on_the_way ?? 0);

  const statusPeriod = getChartPeriod(rawParams, "status");
  const trendPeriod = getChartPeriod(rawParams, "trend");
  const servicePeriod = getChartPeriod(rawParams, "service");
  const priorityPeriod = getChartPeriod(rawParams, "priority");
  const insightsPeriod = getChartPeriod(rawParams, "insights");

  const statusOrders = filterOrdersWithPeriod(allOrders, params, statusPeriod);
  const trendOrders = filterOrdersWithPeriod(allOrders, params, trendPeriod);
  const serviceOrders = filterOrdersWithPeriod(allOrders, params, servicePeriod);
  const priorityOrders = filterOrdersWithPeriod(
    allOrders,
    params,
    priorityPeriod,
  );
  const insightsOrders = filterOrdersWithPeriod(
    allOrders,
    params,
    insightsPeriod,
  );
  const insightsKpis = buildDashboardKpis(insightsOrders);

  const chartTabs = (
    key: "status" | "trend" | "service" | "priority" | "insights",
    period: typeof statusPeriod,
  ) => (
    <ChartPeriodTabs
      pathname="/admin"
      paramKey={getChartPeriodParamKey(key)}
      active={period}
      preserveParams={rawParams}
    />
  );

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={t.dashboard.admin.overview}>
        <p className="text-muted">
          {t.dashboard.admin.title} — {periodLabel}
        </p>
      </DashboardPageHeader>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted">
          {t.dashboard.common.ordersForPeriod} — {periodLabel}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label={t.dashboard.admin.totalOrders}
            value={kpis.total}
            hint={periodLabel}
            icon={ClipboardList}
          />
          <StatCard
            label={t.dashboard.admin.todayOrders}
            value={kpis.todayCount}
            icon={TrendingUp}
            accent
          />
          <StatCard
            label={t.dashboard.admin.highPriority}
            value={kpis.highPriority}
            icon={AlertTriangle}
            accent
          />
          <StatCard
            label={t.dashboard.admin.inProgress}
            value={inProgress}
            hint={t.dashboard.admin.inProgressHint}
            icon={Clock}
            accent
          />
          <StatCard
            label={t.dashboard.admin.unassigned}
            value={kpis.unassigned}
            hint={t.dashboard.admin.unassignedHint}
            icon={Users}
          />
          <StatCard
            label={t.labels.status.completed}
            value={kpis.completed}
            icon={CheckCircle2}
            accent
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-muted">{t.dashboard.admin.usersSection}</h2>
          <Link
            href="/admin/users"
            className="text-sm font-semibold text-primary hover:underline"
          >
            {t.dashboard.common.manageUsers}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t.dashboard.admin.clients}
            value={userStats.clients}
            hint={`${userStats.activeClients} ${t.dashboard.common.activeHint}`}
            icon={UserRound}
            accent
          />
          <StatCard
            label={t.dashboard.admin.technicians}
            value={userStats.technicians}
            hint={`${userStats.activeTechnicians} ${t.dashboard.common.activeHint}`}
            icon={Wrench}
            accent
          />
          <StatCard
            label={t.dashboard.admin.admins}
            value={userStats.admins}
            hint={`${userStats.activeAdmins} ${t.dashboard.common.activeHint}`}
            icon={Shield}
          />
          <StatCard
            label={t.dashboard.admin.totalAccounts}
            value={userStats.total}
            icon={Users}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatusDonutChart
          data={buildStatusChartData(t, statusOrders)}
          title={t.dashboard.charts.statusDistribution}
          headerAction={chartTabs("status", statusPeriod)}
        />
        <WeeklyTrendChart
          data={buildOverviewTrend(trendOrders, trendPeriod, locale)}
          title={getOverviewTrendTitle(t, trendPeriod)}
          headerAction={chartTabs("trend", trendPeriod)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ServiceTypeBarChart
          data={buildServiceTypeChartData(t, serviceOrders)}
          title={t.dashboard.charts.byServiceType}
          headerAction={chartTabs("service", servicePeriod)}
        />
        <PriorityBarChart
          data={buildPriorityChartData(t, priorityOrders)}
          title={t.dashboard.charts.priorityDistribution}
          headerAction={chartTabs("priority", priorityPeriod)}
        />
        <ServiceTypeBarChart
          data={userChartData}
          title={t.dashboard.charts.usersByRole}
        />
      </div>

      <KpiInsightsCard
        title={t.dashboard.charts.quickInsights}
        headerAction={chartTabs("insights", insightsPeriod)}
        items={[
          {
            label: t.dashboard.admin.avgCompletionDays,
            value:
              insightsKpis.avgCompletionDays !== null
                ? `${insightsKpis.avgCompletionDays} ${t.common.day}`
                : t.common.dash,
          },
          { label: t.dashboard.admin.cancelled, value: insightsKpis.cancelled },
          {
            label: t.dashboard.admin.completionRate,
            value:
              insightsKpis.total > 0
                ? `${Math.round((insightsKpis.completed / insightsKpis.total) * 100)}%`
                : t.common.dash,
          },
          {
            label: t.dashboard.admin.activeTechniciansRatio,
            value: `${userStats.activeTechnicians} / ${userStats.technicians}`,
          },
        ]}
      />

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {t.dashboard.common.ordersForPeriod} — {periodLabel}
            </h2>
            <Link
              href="/admin/orders"
              className="text-sm font-semibold text-primary"
            >
              {t.dashboard.common.manageOrders}
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">
              {`${t.dashboard.admin.noOrdersInPeriod} ${periodLabel}.`}
            </p>
          ) : (
            <AdminOverviewOrdersTable
              orders={orders}
              statusLabels={statusLabels}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

