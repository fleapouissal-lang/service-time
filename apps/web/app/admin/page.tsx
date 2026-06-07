import Link from "next/link";
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
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_LABELS } from "@/lib/constants";
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
import {
  ORDER_SEARCH_PLACEHOLDER,
  PRIORITY_FILTER_OPTIONS,
  SERVICE_TYPE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "@/lib/dashboard-filter-options";
import {
  ALL_CHART_PERIOD_PARAM_KEYS,
  buildOverviewTrend,
  filterByOverviewPeriod,
  filterOrdersWithPeriod,
  filterOverviewOrders,
  getChartPeriod,
  getChartPeriodParamKey,
  getOverviewPeriodLabel,
  getOverviewTrendTitle,
  OVERVIEW_PERIOD_OPTIONS,
  parseOverviewFilters,
} from "@/lib/overview-period";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminHomePage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const params = parseOverviewFilters(rawParams);

  const [allOrders, userStats, userChartData] = await Promise.all([
    getAdminServiceRequests(),
    getUserRoleStats(),
    buildUserRoleChartData(),
  ]);

  const periodOrders = filterByOverviewPeriod(allOrders, params.period);
  const orders = filterOverviewOrders(allOrders, params);
  const kpis = buildDashboardKpis(orders);
  const periodLabel = getOverviewPeriodLabel(params.period);
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
      <div>
        <h1 className="text-2xl font-bold">نظرة عامة</h1>
        <p className="text-muted">
          إحصائيات ورسوم بيانية — {periodLabel}
        </p>
      </div>

      <DashboardFilterBar
        pathname="/admin"
        values={params}
        preserveParams={rawParams}
        hiddenFields={ALL_CHART_PERIOD_PARAM_KEYS}
        searchPlaceholder={ORDER_SEARCH_PLACEHOLDER}
        selects={[
          {
            name: "period",
            label: "فترة الإحصائيات",
            options: OVERVIEW_PERIOD_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            })),
            hideAllOption: true,
          },
          { name: "status", label: "الحالة", options: STATUS_FILTER_OPTIONS },
          {
            name: "priority",
            label: "الأولوية",
            options: PRIORITY_FILTER_OPTIONS,
          },
          {
            name: "service_type",
            label: "نوع الخدمة",
            options: SERVICE_TYPE_FILTER_OPTIONS,
          },
        ]}
        resultCount={orders.length}
        totalCount={periodOrders.length}
      />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted">
          الطلبات — {periodLabel}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <StatCard
            label="إجمالي الطلبات"
            value={kpis.total}
            hint={periodLabel}
            icon={ClipboardList}
          />
          <StatCard
            label="طلبات اليوم"
            value={kpis.todayCount}
            icon={TrendingUp}
            accent
          />
          <StatCard
            label="أولوية عالية"
            value={kpis.highPriority}
            icon={AlertTriangle}
            accent
          />
          <StatCard
            label="قيد التنفيذ"
            value={inProgress}
            hint="تنفيذ + في الطريق"
            icon={Clock}
            accent
          />
          <StatCard
            label="غير معيّنة"
            value={kpis.unassigned}
            hint="بانتظار فني"
            icon={Users}
          />
          <StatCard
            label="مكتمل"
            value={kpis.completed}
            icon={CheckCircle2}
            accent
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-muted">المستخدمون</h2>
          <Link
            href="/admin/users"
            className="text-sm font-semibold text-primary hover:underline"
          >
            إدارة المستخدمين
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="عملاء"
            value={userStats.clients}
            hint={`${userStats.activeClients} نشط`}
            icon={UserRound}
            accent
          />
          <StatCard
            label="فنيون"
            value={userStats.technicians}
            hint={`${userStats.activeTechnicians} نشط`}
            icon={Wrench}
            accent
          />
          <StatCard
            label="مديرون"
            value={userStats.admins}
            hint={`${userStats.activeAdmins} نشط`}
            icon={Shield}
          />
          <StatCard
            label="إجمالي الحسابات"
            value={userStats.total}
            icon={Users}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatusDonutChart
          data={buildStatusChartData(statusOrders)}
          title="توزيع الحالات"
          headerAction={chartTabs("status", statusPeriod)}
        />
        <WeeklyTrendChart
          data={buildOverviewTrend(trendOrders, trendPeriod)}
          title={getOverviewTrendTitle(trendPeriod)}
          headerAction={chartTabs("trend", trendPeriod)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ServiceTypeBarChart
          data={buildServiceTypeChartData(serviceOrders)}
          title="حسب نوع الخدمة"
          headerAction={chartTabs("service", servicePeriod)}
        />
        <PriorityBarChart
          data={buildPriorityChartData(priorityOrders)}
          title="توزيع الأولويات"
          headerAction={chartTabs("priority", priorityPeriod)}
        />
        <ServiceTypeBarChart
          data={userChartData}
          title="المستخدمون حسب النوع"
        />
      </div>

      <KpiInsightsCard
        title="تحليل سريع"
        headerAction={chartTabs("insights", insightsPeriod)}
        items={[
          {
            label: "متوسط أيام الإنجاز",
            value:
              insightsKpis.avgCompletionDays !== null
                ? `${insightsKpis.avgCompletionDays} يوم`
                : "—",
          },
          { label: "ملغاة", value: insightsKpis.cancelled },
          {
            label: "نسبة إنجاز الطلبات",
            value:
              insightsKpis.total > 0
                ? `${Math.round((insightsKpis.completed / insightsKpis.total) * 100)}%`
                : "—",
          },
          {
            label: "فنيون نشطون / إجمالي",
            value: `${userStats.activeTechnicians} / ${userStats.technicians}`,
          },
        ]}
      />

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">الطلبات — {periodLabel}</h2>
            <Link
              href="/admin/orders"
              className="text-sm font-semibold text-primary"
            >
              إدارة الطلبات
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">
              {periodOrders.length === 0
                ? `لا توجد طلبات في ${periodLabel}.`
                : "لا توجد نتائج مطابقة للتصفية."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b text-right text-muted">
                    <th className="pb-2 font-medium">العميل</th>
                    <th className="pb-2 font-medium">الحالة</th>
                    <th className="pb-2 font-medium">الأولوية</th>
                    <th className="pb-2 font-medium">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 20).map((order) => (
                    <tr key={order.id} className="border-b border-border">
                      <td className="py-3 font-medium">{order.customer_name}</td>
                      <td className="py-3">
                        {
                          STATUS_LABELS[
                            order.status as keyof typeof STATUS_LABELS
                          ]
                        }
                      </td>
                      <td className="py-3 text-muted">{order.priority}</td>
                      <td className="py-3 text-muted">
                        {new Date(order.created_at).toLocaleDateString("ar-SA")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
