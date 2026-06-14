import type { Metadata } from "next";
import { ClientOrdersTable } from "@/components/client/client-orders-table";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { TrackingSearch } from "@/components/tracking/tracking-search";
import {
  getClientOrderSearchPlaceholder,
  getStatusFilterOptionsForDashboard,
} from "@/lib/dashboard-filter-options";
import { getClientRequests } from "@/lib/dashboard-queries";
import {
  getRequestPhotosByRequestIds,
  requestPhotoCountsFromMap,
} from "@/lib/request-photos-queries";
import {
  getExecutionMethodLabels,
  getServiceTypeLabels,
  getStatusLabels,
} from "@/lib/i18n/labels";
import { getServerI18n } from "@/lib/i18n/server";
import { filterServiceRequests, parseListFilters } from "@/lib/list-filters";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.meta.clientTrack };
}

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ClientTrackPage({ searchParams }: PageProps) {
  const { t } = await getServerI18n();
  const params = parseListFilters(await searchParams);
  const allOrders = await getClientRequests();
  const orders = filterServiceRequests(allOrders, params);
  const photosByRequestId = await getRequestPhotosByRequestIds(
    orders.map((order) => order.id),
  );
  const photoCounts = requestPhotoCountsFromMap(photosByRequestId);
  const serviceTypeLabels = getServiceTypeLabels(t);
  const statusLabels = getStatusLabels(t);
  const executionMethodLabels = getExecutionMethodLabels(t);

  return (
    <div className="mx-auto w-[90%] max-w-[1200px] space-y-6 pb-16">
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold">{t.dashboard.client.track}</h1>
        <p className="text-muted">{t.tracking.description}</p>
      </div>

      <DashboardFilterBar
        pathname="/client/track"
        values={params}
        searchPlaceholder={getClientOrderSearchPlaceholder(t)}
        selects={[
          {
            name: "status",
            label: t.common.status,
            options: getStatusFilterOptionsForDashboard(t),
          },
        ]}
        resultCount={orders.length}
        totalCount={allOrders.length}
      />

      <TrackingSearch embedded />

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold">{t.dashboard.client.orders}</h2>
          </div>
          {orders.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              {allOrders.length === 0
                ? t.common.noData
                : t.common.noResultsFiltered}
            </p>
          ) : (
            <ClientOrdersTable
              orders={orders}
              photoCounts={photoCounts}
              photosByRequestId={photosByRequestId}
              statusLabels={statusLabels}
              serviceTypeLabels={serviceTypeLabels}
              executionMethodLabels={executionMethodLabels}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
