import Link from "next/link";
import {
  Car,
  CheckCircle2,
  ClipboardList,
  MapPin,
  PlusCircle,
} from "lucide-react";
import { ChartPeriodTabs } from "@/components/dashboard/chart-period-tabs";
import {
  KpiInsightsCard,
  StatusDonutChart,
  WeeklyTrendChart,
} from "@/components/dashboard/dashboard-charts";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_LABELS } from "@/lib/constants";
import {
  buildDashboardKpis,
  buildStatusChartData,
} from "@/lib/dashboard-analytics";
import {
  CLIENT_ORDER_SEARCH_PLACEHOLDER,
  SERVICE_TYPE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "@/lib/dashboard-filter-options";
import { getClientRequests } from "@/lib/dashboard-queries";
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

export default async function ClientHomePage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const params = parseOverviewFilters(rawParams);
  const allOrders = await getClientRequests();
  const periodOrders = filterByOverviewPeriod(allOrders, params.period);
  const orders = filterOverviewOrders(allOrders, params);
  const kpis = buildDashboardKpis(orders);
  const periodLabel = getOverviewPeriodLabel(params.period);
  const enRoute =
    (kpis.byStatus.on_the_way ?? 0) + (kpis.byStatus.arrived ?? 0);

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
      pathname="/client"
      paramKey={getChartPeriodParamKey(key)}
      active={period}
      preserveParams={rawParams}
    />
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">لوحة العميل</h1>
        <p className="text-muted">إحصائيات طلباتك — {periodLabel}</p>
      </div>

      <DashboardFilterBar
        pathname="/client"
        values={params}
        preserveParams={rawParams}
        hiddenFields={ALL_CHART_PERIOD_PARAM_KEYS}
        searchPlaceholder={CLIENT_ORDER_SEARCH_PLACEHOLDER}
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
            name: "service_type",
            label: "نوع الخدمة",
            options: SERVICE_TYPE_FILTER_OPTIONS,
          },
        ]}
        resultCount={orders.length}
        totalCount={periodOrders.length}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="إجمالي الطلبات"
          value={kpis.total}
          hint={periodLabel}
          icon={ClipboardList}
        />
        <StatCard
          label="طلبات نشطة"
          value={kpis.active}
          hint="قيد المعالجة"
          icon={Car}
          accent
        />
        <StatCard
          label="الفني في الطريق"
          value={enRoute}
          icon={MapPin}
          accent
        />
        <StatCard
          label="مكتمل"
          value={kpis.completed}
          icon={CheckCircle2}
          accent
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/client/request"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <PlusCircle className="size-4" aria-hidden />
          طلب خدمة جديد
        </Link>
        <Link
          href="/client/orders"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-primary/5"
        >
          كل طلباتي
        </Link>
        <Link
          href="/client/track"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-primary/5"
        >
          تتبع طلب
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatusDonutChart
          data={buildStatusChartData(statusOrders)}
          title="حالة طلباتك"
          headerAction={chartTabs("status", statusPeriod)}
        />
        <WeeklyTrendChart
          data={buildOverviewTrend(trendOrders, trendPeriod)}
          title={getOverviewTrendTitle(trendPeriod)}
          headerAction={chartTabs("trend", trendPeriod)}
        />
        <KpiInsightsCard
          title="ملخص"
          headerAction={chartTabs("insights", insightsPeriod)}
          items={[
            {
              label: "بانتظار التعيين",
              value: insightsKpis.byStatus.received ?? 0,
            },
            {
              label: "جاري التنفيذ",
              value: insightsKpis.byStatus.in_progress ?? 0,
            },
            { label: "ملغاة", value: insightsKpis.cancelled },
            {
              label: "نسبة الإنجاز",
              value:
                insightsKpis.total > 0
                  ? `${Math.round((insightsKpis.completed / insightsKpis.total) * 100)}%`
                  : "—",
            },
          ]}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">طلباتي — {periodLabel}</h2>
            <Link
              href="/client/orders"
              className="text-sm font-semibold text-primary"
            >
              عرض الكل
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="text-sm text-muted">
              {periodOrders.length === 0 ? (
                <>
                  لا توجد طلبات في {periodLabel}.{" "}
                  <Link href="/client/request" className="text-primary">
                    اطلب خدمتك الأولى
                  </Link>
                </>
              ) : (
                "لا توجد نتائج مطابقة للتصفية."
              )}
            </p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 10).map((order) => (
                <Link
                  key={order.id}
                  href={`/client/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-primary/5"
                >
                  <div>
                    <p className="font-semibold">
                      {order.car_type ?? "طلب خدمة"}
                    </p>
                    <p className="text-sm text-muted">
                      {new Date(order.created_at).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {
                      STATUS_LABELS[
                        order.status as keyof typeof STATUS_LABELS
                      ]
                    }
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
