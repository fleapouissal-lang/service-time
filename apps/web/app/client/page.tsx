import Link from "next/link";
import {
  Car,
  CheckCircle2,
  ClipboardList,
  MapPin,
  PlusCircle,
} from "lucide-react";
import { ClientLatestTrackingSection } from "@/components/client/client-latest-tracking-section";
import { ChartPeriodTabs } from "@/components/dashboard/chart-period-tabs";
import {
  KpiInsightsCard,
  StatusDonutChart,
  WeeklyTrendChart,
} from "@/components/dashboard/dashboard-charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import {
  buildDashboardKpis,
  buildStatusChartData,
} from "@/lib/dashboard-analytics";
import { getClientRequests, getRequestStatusHistory, getTechnicianLiveLocation } from "@/lib/dashboard-queries";
import { pickLatestTrackableOrder } from "@/lib/client-latest-tracking";
import { getIntlLocale } from "@/lib/i18n/config";
import {
  getOverviewPeriodLabel,
  getOverviewTrendTitle,
  getStatusLabels,
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

export default async function ClientHomePage({ searchParams }: PageProps) {
  const { t, locale } = await getServerI18n();
  const rawParams = await searchParams;
  const params = parseOverviewFilters(rawParams);
  const allOrders = await getClientRequests();
  const latestOrder = pickLatestTrackableOrder(allOrders);
  const latestHistory = latestOrder
    ? await getRequestStatusHistory(latestOrder.id)
    : [];
  const latestShowLiveMap =
    latestOrder?.status === "on_the_way" ||
    latestOrder?.status === "arrived";
  const latestTechnicianLocation =
    latestShowLiveMap && latestOrder?.assigned_technician_id
      ? await getTechnicianLiveLocation(latestOrder.assigned_technician_id)
      : null;
  const periodOrders = filterByOverviewPeriod(allOrders, params.period);
  const orders = periodOrders;
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

      <ClientLatestTrackingSection
        order={latestOrder}
        history={latestHistory}
        initialTechnicianCoords={
          latestTechnicianLocation
            ? {
                lat: latestTechnicianLocation.lat,
                lng: latestTechnicianLocation.lng,
              }
            : null
        }
      />

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
              {`${t.dashboard.client.noOrdersInPeriod} ${periodLabel}`}{" "}
              <Link href="/client/request" className="text-primary">
                {t.dashboard.client.requestFirst}
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 10).map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
                >
                  <Link
                    href={`/client/orders/${order.id}`}
                    className="min-w-0 flex-1 transition-colors hover:text-primary"
                  >
                    <p className="font-semibold">
                      {order.car_type ?? t.dashboard.common.serviceRequest}
                    </p>
                    <p className="text-sm text-muted">
                      {new Date(order.created_at).toLocaleDateString(intlLocale)}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted" dir="ltr">
                      {order.tracking_token}
                    </p>
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-primary">
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </span>
                    <Link
                      href={`/client/track/${order.tracking_token}`}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-xs font-semibold transition-colors hover:bg-primary/5"
                    >
                      {t.dashboard.client.track}
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
