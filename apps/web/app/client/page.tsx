import Link from "next/link";
import {
  Car,
  CheckCircle2,
  ClipboardList,
  MapPin,
  PlusCircle,
} from "lucide-react";
import { ClientAccountLinks } from "@/components/client/client-account-links";
import { ClientLatestTrackingSection } from "@/components/client/client-latest-tracking-section";
import { StatCard } from "@/components/dashboard/stat-card";
import { buildDashboardKpis } from "@/lib/dashboard-analytics";
import {
  getClientRequests,
  getRequestStatusHistory,
  getTechnicianLiveLocation,
} from "@/lib/dashboard-queries";
import { pickLatestTrackableOrder } from "@/lib/client-latest-tracking";
import { getOverviewPeriodLabel, getStatusLabels } from "@/lib/i18n/labels";
import { getServerI18n } from "@/lib/i18n/server";
import {
  filterByOverviewPeriod,
  parseOverviewFilters,
} from "@/lib/overview-period";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ClientHomePage({ searchParams }: PageProps) {
  const { t } = await getServerI18n();
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
  const kpis = buildDashboardKpis(periodOrders);
  const periodLabel = getOverviewPeriodLabel(t, params.period);
  const enRoute =
    (kpis.byStatus.on_the_way ?? 0) + (kpis.byStatus.arrived ?? 0);

  return (
    <div className="space-y-8">
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold">{t.dashboard.client.title}</h1>
        <p className="text-muted">
          {`${t.dashboard.client.subtitle} — ${periodLabel}`}
        </p>
      </div>

      <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          className="hidden h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-primary/5 md:inline-flex"
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

      <ClientAccountLinks
        items={["track", "settings"]}
        className="md:hidden"
      />
    </div>
  );
}
