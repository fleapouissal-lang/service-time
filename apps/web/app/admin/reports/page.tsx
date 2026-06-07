import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  Package,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import {
  AdminReportsHeader,
  AdminReportsSummaryStrip,
} from "@/components/admin/admin-reports-header";
import { AdminReportsSection } from "@/components/admin/admin-reports-section";
import { AdminReportsStatusBreakdown } from "@/components/admin/admin-reports-status-breakdown";
import {
  KpiInsightsCard,
  PriorityBarChart,
  ServiceTypeBarChart,
  StatusDonutChart,
  WeeklyTrendChart,
} from "@/components/dashboard/dashboard-charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  buildDashboardKpis,
  buildPriorityChartData,
  buildServiceTypeChartData,
  buildStatusChartData,
  buildWeeklyTrend,
} from "@/lib/dashboard-analytics";
import { getAdminServiceRequests, getUserRoleStats } from "@/lib/admin-dashboard-data";
import { formatSparePartPrice } from "@/lib/format-price";
import { getIntlLocale } from "@/lib/i18n/config";
import { getStatusLabels } from "@/lib/i18n/labels";
import { getSparePartOrderStatusLabelsForDashboard } from "@/lib/spare-part-order-labels";
import { getServerI18n } from "@/lib/i18n/server";
import { buildSparePartOrdersReport } from "@/lib/reports-analytics";
import { getAdminSparePartOrders } from "@/lib/spare-part-orders-queries";

export default async function AdminReportsPage() {
  const { t, locale } = await getServerI18n();
  const r = t.dashboard.admin.reportsPage;
  const intlLocale = getIntlLocale(locale);

  const [allOrders, allSparePartOrders, userStats] = await Promise.all([
    getAdminServiceRequests(),
    getAdminSparePartOrders(),
    getUserRoleStats(),
  ]);

  const orders = allOrders;
  const sparePartOrders = allSparePartOrders;
  const stats = buildDashboardKpis(orders);
  const spareStats = buildSparePartOrdersReport(sparePartOrders);
  const statusLabels = getStatusLabels(t);
  const spareStatusLabels = getSparePartOrderStatusLabelsForDashboard(t);
  const periodLabel = t.common.all;
  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : null;

  const statusBreakdown = Object.entries(statusLabels).map(([key, label]) => ({
    key,
    label,
    value: stats.byStatus[key] ?? 0,
  }));

  const spareStatusBreakdown = Object.entries(spareStatusLabels).map(
    ([key, label]) => ({
      key,
      label,
      value: spareStats.byStatus[key as keyof typeof spareStats.byStatus] ?? 0,
    }),
  );

  const updatedAt = new Date().toLocaleString(intlLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-6 md:space-y-8">
      <AdminReportsHeader
        title={t.dashboard.admin.reports}
        subtitle={r.subtitle}
        periodLabel={periodLabel}
        periodCaption={r.filteredPeriod}
        matchingCaption={r.matchingOrders}
        matchingCount={orders.length}
        totalCount={allOrders.length}
        updatedCaption={`${r.lastUpdated}: ${updatedAt}`}
      />

      <AdminReportsSummaryStrip
        items={[
          {
            label: r.summaryTotalOrders,
            value: stats.total,
            icon: ClipboardList,
            accent: true,
          },
          {
            label: r.summaryCompletionRate,
            value: completionRate !== null ? `${completionRate}%` : t.common.dash,
            icon: CheckCircle2,
          },
          {
            label: r.summaryActiveOrders,
            value: stats.active,
            icon: Clock,
          },
          {
            label: r.summarySpareRevenue,
            value: formatSparePartPrice(spareStats.revenue, locale),
            icon: Wallet,
            accent: true,
          },
        ]}
      />

      <AdminReportsSection
        title={r.serviceRequestsSection}
        description={r.serviceRequestsDesc}
        icon={BarChart3}
        actionHref="/admin/orders"
        actionLabel={t.dashboard.admin.orders}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t.dashboard.admin.totalOrders}
            value={stats.total}
            hint={periodLabel}
            icon={ClipboardList}
          />
          <StatCard
            label={t.dashboard.admin.todayOrders}
            value={stats.todayCount}
            icon={TrendingUp}
            accent
          />
          <StatCard
            label={r.activeOrders}
            value={stats.active}
            icon={Clock}
            accent
          />
          <StatCard
            label={t.labels.status.completed}
            value={stats.completed}
            icon={CheckCircle2}
            accent
          />
          <StatCard
            label={t.dashboard.admin.highPriority}
            value={stats.highPriority}
            icon={AlertTriangle}
            accent
          />
          <StatCard
            label={t.dashboard.admin.unassigned}
            value={stats.unassigned}
            icon={Users}
          />
          <StatCard
            label={r.last7Days}
            value={stats.weekCount}
            icon={TrendingUp}
          />
          <StatCard
            label={t.dashboard.admin.avgCompletionDays}
            value={
              stats.avgCompletionDays !== null
                ? `${stats.avgCompletionDays} ${t.common.day}`
                : t.common.dash
            }
            icon={Clock}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <StatusDonutChart
            data={buildStatusChartData(t, orders)}
            title={t.dashboard.charts.statusDistribution}
          />
          <WeeklyTrendChart
            data={buildWeeklyTrend(orders, locale, 30)}
            title={r.trend30Days}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ServiceTypeBarChart
            data={buildServiceTypeChartData(t, orders)}
            title={t.dashboard.charts.byServiceType}
          />
          <PriorityBarChart
            data={buildPriorityChartData(t, orders)}
            title={t.dashboard.charts.priorityDistribution}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <AdminReportsStatusBreakdown
            title={r.statusBreakdown}
            items={statusBreakdown}
            total={stats.total}
            emptyLabel={t.common.noData}
          />
          <KpiInsightsCard
            title={t.dashboard.charts.quickInsights}
            items={[
              {
                label: t.dashboard.admin.completionRate,
                value: completionRate !== null ? `${completionRate}%` : t.common.dash,
              },
              {
                label: t.dashboard.admin.cancelled,
                value: stats.cancelled,
              },
              {
                label: r.completionTime,
                value:
                  stats.avgCompletionDays !== null
                    ? `${stats.avgCompletionDays} ${t.common.day}`
                    : t.common.dash,
              },
            ]}
          />
        </div>
      </AdminReportsSection>

      <AdminReportsSection
        title={r.sparePartsSection}
        description={r.sparePartsDesc}
        icon={Package}
        actionHref="/admin/spare-part-orders"
        actionLabel={r.viewSparePartOrders}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={r.sparePartOrdersTotal}
            value={spareStats.total}
            hint={periodLabel}
            icon={Package}
          />
          <StatCard
            label={r.sparePartRevenue}
            value={formatSparePartPrice(spareStats.revenue, locale)}
            icon={Wallet}
            accent
          />
          <StatCard
            label={r.paidOrders}
            value={spareStats.paid}
            icon={CheckCircle2}
            accent
          />
          <StatCard
            label={r.pendingPayments}
            value={spareStats.pendingPayment}
            icon={Clock}
          />
        </div>
        <AdminReportsStatusBreakdown
          title={r.sparePartStatusBreakdown}
          items={spareStatusBreakdown}
          total={spareStats.total}
          emptyLabel={t.common.noData}
        />
      </AdminReportsSection>

      <AdminReportsSection
        title={r.usersSection}
        description={r.usersDesc}
        icon={Users}
        actionHref="/admin/users"
        actionLabel={t.dashboard.common.manageUsers}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t.dashboard.admin.totalAccounts}
            value={userStats.total}
            icon={Users}
          />
          <StatCard
            label={t.dashboard.admin.clients}
            value={userStats.clients}
            hint={`${userStats.activeClients} ${t.dashboard.common.activeHint}`}
            icon={Users}
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
            icon={Users}
          />
        </div>
      </AdminReportsSection>

      <Card className="border-primary/15 bg-gradient-to-r from-primary/[0.04] to-card">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="font-semibold">{r.quickActionsTitle}</p>
            <p className="mt-1 text-sm text-muted">{r.exportHint}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/orders" className={buttonVariants({ variant: "default" })}>
              {t.dashboard.admin.orders}
            </Link>
            <Link href="/admin/spare-part-orders" className={buttonVariants({ variant: "outline" })}>
              {t.dashboard.admin.sparePartOrders}
            </Link>
            <Link href="/admin/users" className={buttonVariants({ variant: "outline" })}>
              {t.meta.adminUsers}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
