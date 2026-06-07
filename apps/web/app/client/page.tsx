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
import {
  buildDashboardKpis,
  buildStatusChartData,
} from "@/lib/dashboard-analytics";
import {
  getClientOrderSearchPlaceholder,
  getServiceTypeFilterOptionsForDashboard,
  getStatusFilterOptionsForDashboard,
} from "@/lib/dashboard-filter-options";
import { getClientRequests } from "@/lib/dashboard-queries";
import { getIntlLocale } from "@/lib/i18n/config";
import {
  getOverviewPeriodLabel,
  getOverviewPeriodOptions,
  getOverviewTrendTitle,
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

export default async function ClientHomePage({ searchParams }: PageProps) {
  const { t, locale } = await getServerI18n();
  const rawParams = await searchParams;
  const params = parseOverviewFilters(rawParams);
  const allOrders = await getClientRequests();
  const periodOrders = filterByOverviewPeriod(allOrders, params.period);
  const orders = filterOverviewOrders(allOrders, params);
  const kpis = buildDashboardKpis(orders);
  const periodLabel = getOverviewPeriodLabel(t, params.period);
  const statusLabels = getStatusLabels(t);
  const intlLocale = getIntlLocale(locale);
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
        <h1 className="text-2xl font-bold">{t.dashboard.client.title}</h1>
        <p className="text-muted">
          {`${t.dashboard.client.subtitle} — ${periodLabel}`}
        </p>
      </div>

      <DashboardFilterBar
        pathname="/client"
        values={params}
        preserveParams={rawParams}
        hiddenFields={ALL_CHART_PERIOD_PARAM_KEYS}
        searchPlaceholder={getClientOrderSearchPlaceholder(t)}
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
            name: "service_type",
            label: t.request.form.serviceType,
            options: getServiceTypeFilterOptionsForDashboard(t),
          },
        ]}
        resultCount={orders.length}
        totalCount={periodOrders.length}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t.dashboard.client.totalOrders}
          value={kpis.total}
          hint={periodLabel}
          icon={ClipboardList}
        />
        <StatCard
          label={t.dashboard.client.activeOrders}
          value={kpis.active}
          hint={t.dashboard.client.activeOrdersHint}
          icon={Car}
          accent
        />
        <StatCard
          label={t.dashboard.client.technicianEnRoute}
          value={enRoute}
          icon={MapPin}
          accent
        />
        <StatCard
          label={t.dashboard.client.completed}
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
          {t.dashboard.client.newRequest}
        </Link>
        <Link
          href="/client/orders"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-primary/5"
        >
          {t.dashboard.client.allMyOrders}
        </Link>
        <Link
          href="/client/track"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-primary/5"
        >
          {t.dashboard.client.trackOrder}
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatusDonutChart
          data={buildStatusChartData(t, statusOrders)}
          title={t.dashboard.charts.yourOrdersStatus}
          headerAction={chartTabs("status", statusPeriod)}
        />
        <WeeklyTrendChart
          data={buildOverviewTrend(trendOrders, trendPeriod, locale)}
          title={getOverviewTrendTitle(t, trendPeriod)}
          headerAction={chartTabs("trend", trendPeriod)}
        />
        <KpiInsightsCard
          title={t.dashboard.charts.summary}
          headerAction={chartTabs("insights", insightsPeriod)}
          items={[
            {
              label: t.dashboard.client.insights.awaitingAssignment,
              value: insightsKpis.byStatus.received ?? 0,
            },
            {
              label: t.dashboard.client.insights.inProgress,
              value: insightsKpis.byStatus.in_progress ?? 0,
            },
            { label: t.dashboard.client.insights.cancelled, value: insightsKpis.cancelled },
            {
              label: t.dashboard.client.insights.completionRate,
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
            <h2 className="text-lg font-semibold">
              {`${t.dashboard.client.myOrdersPeriod} — ${periodLabel}`}
            </h2>
            <Link
              href="/client/orders"
              className="text-sm font-semibold text-primary"
            >
              {t.common.viewAll}
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="text-sm text-muted">
              {periodOrders.length === 0 ? (
                <>
                  {`${t.dashboard.client.noOrdersInPeriod} ${periodLabel}`}{" "}
                  <Link href="/client/request" className="text-primary">
                    {t.dashboard.client.requestFirst}
                  </Link>
                </>
              ) : (
                t.common.noResults
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
                      {order.car_type ?? t.dashboard.common.serviceRequest}
                    </p>
                    <p className="text-sm text-muted">
                      {new Date(order.created_at).toLocaleDateString(intlLocale)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {statusLabels[order.status as keyof typeof statusLabels]}
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
