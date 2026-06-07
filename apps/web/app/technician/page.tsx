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
  EXECUTION_METHOD_LABELS,
  SERVICE_TYPE_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";
import {
  buildDashboardKpis,
  buildStatusChartData,
} from "@/lib/dashboard-analytics";
import { requireProfile } from "@/lib/auth";
import { getTechnicianRequests } from "@/lib/dashboard-queries";
import {
  ORDER_SEARCH_PLACEHOLDER,
  PRIORITY_FILTER_OPTIONS,
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

export default async function TechnicianHomePage({ searchParams }: PageProps) {
  const profile = await requireProfile(["technician"]);
  if (!profile) return null;

  const rawParams = await searchParams;
  const params = parseOverviewFilters(rawParams);
  const allOrders = await getTechnicianRequests(profile.id);
  const periodOrders = filterByOverviewPeriod(allOrders, params.period);
  const orders = filterOverviewOrders(allOrders, params);
  const kpis = buildDashboardKpis(orders);
  const periodLabel = getOverviewPeriodLabel(params.period);
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
        <h1 className="text-2xl font-bold">لوحة الفني</h1>
        <p className="text-muted">إحصائيات أدائك — {periodLabel}</p>
      </div>

      <DashboardFilterBar
        pathname="/technician"
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
        ]}
        resultCount={orders.length}
        totalCount={periodOrders.length}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="إجمالي المعيّن"
          value={kpis.total}
          hint={periodLabel}
          icon={ClipboardList}
        />
        <StatCard
          label="نشطة"
          value={kpis.active}
          hint="غير مكتملة"
          icon={Wrench}
          accent
        />
        <StatCard
          label="قيد التنفيذ"
          value={inProgress}
          icon={Clock}
          accent
        />
        <StatCard
          label="أولوية عالية"
          value={kpis.highPriority}
          icon={AlertTriangle}
          accent
        />
        <StatCard
          label="مكتمل"
          value={kpis.completed}
          hint={periodLabel}
          icon={CheckCircle2}
          accent
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatusDonutChart
          data={buildStatusChartData(statusOrders)}
          title="توزيع طلباتي"
          headerAction={chartTabs("status", statusPeriod)}
        />
        <WeeklyTrendChart
          data={buildOverviewTrend(trendOrders, trendPeriod)}
          title={getOverviewTrendTitle(trendPeriod)}
          headerAction={chartTabs("trend", trendPeriod)}
        />
        <KpiInsightsCard
          title="تحليل سريع"
          headerAction={chartTabs("insights", insightsPeriod)}
          items={[
            { label: "تم الاستلام", value: insightsKpis.byStatus.received ?? 0 },
            { label: "وصلت للموقع", value: insightsKpis.byStatus.arrived ?? 0 },
            { label: "مكتمل", value: insightsKpis.completed },
            { label: "ملغاة", value: insightsKpis.cancelled },
          ]}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              طلباتي المعينة — {periodLabel}
            </h2>
            <Link
              href="/technician/location"
              className="text-sm font-semibold text-primary"
            >
              موقعي
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="text-sm text-muted">
              {periodOrders.length === 0
                ? `لا توجد طلبات في ${periodLabel}.`
                : "لا توجد نتائج مطابقة للتصفية."}
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
                      {SERVICE_TYPE_LABELS[order.service_type]} ·{" "}
                      {EXECUTION_METHOD_LABELS[order.execution_method]}
                    </p>
                    <p className="mt-1 text-sm">
                      {order.location_text ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      {
                        STATUS_LABELS[
                          order.status as keyof typeof STATUS_LABELS
                        ]
                      }
                    </Badge>
                    <Link
                      href={`/technician/orders/${order.id}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      إدارة
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
