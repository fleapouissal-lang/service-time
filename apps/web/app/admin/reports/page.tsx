import { Card, CardContent } from "@/components/ui/card";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { buildDashboardKpis } from "@/lib/dashboard-analytics";
import { getAdminServiceRequests } from "@/lib/admin-dashboard-data";
import {
  getOrderSearchPlaceholder,
  getPeriodFilterOptionsForDashboard,
  getPriorityFilterOptionsForDashboard,
  getServiceTypeFilterOptionsForDashboard,
  getStatusFilterOptionsForDashboard,
} from "@/lib/dashboard-filter-options";
import { getStatusLabels } from "@/lib/i18n/labels";
import { getServerI18n } from "@/lib/i18n/server";
import { filterServiceRequests, parseListFilters } from "@/lib/list-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const { t } = await getServerI18n();
  const params = parseListFilters(await searchParams);
  const allOrders = await getAdminServiceRequests();
  const orders = filterServiceRequests(allOrders, params);
  const stats = buildDashboardKpis(orders);
  const statusLabels = getStatusLabels(t);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard.admin.reports}</h1>
        <p className="text-sm text-muted">{t.dashboard.admin.title}</p>
      </div>

      <DashboardFilterBar
        pathname="/admin/reports"
        values={params}
        searchPlaceholder={getOrderSearchPlaceholder(t)}
        selects={[
          {
            name: "period",
            label: t.common.period,
            options: getPeriodFilterOptionsForDashboard(t),
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
          {
            name: "service_type",
            label: t.request.form.serviceType,
            options: getServiceTypeFilterOptionsForDashboard(t),
          },
        ]}
        resultCount={orders.length}
        totalCount={allOrders.length}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">{t.dashboard.charts.statusDistribution}</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {Object.entries(statusLabels).map(([key, label]) => (
                <li key={key} className="flex justify-between">
                  <span>{label}</span>
                  <span className="font-semibold">
                    {stats.byStatus[key] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">{t.dashboard.charts.quickInsights}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt>{t.dashboard.admin.totalOrders}</dt>
                <dd className="font-semibold">{stats.total}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t.dashboard.admin.highPriority}</dt>
                <dd className="font-semibold">{stats.highPriority}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t.dashboard.admin.avgCompletionDays}</dt>
                <dd className="font-semibold">
                  {stats.avgCompletionDays !== null
                    ? `${stats.avgCompletionDays} ${t.common.day}`
                    : t.common.dash}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>{t.dashboard.admin.todayOrders}</dt>
                <dd className="font-semibold">{stats.weekCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{t.dashboard.admin.unassigned}</dt>
                <dd className="font-semibold">{stats.unassigned}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
