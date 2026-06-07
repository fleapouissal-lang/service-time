import type { Metadata } from "next";
import Link from "next/link";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TrackingSearch } from "@/components/tracking/tracking-search";
import {
  getClientOrderSearchPlaceholder,
  getStatusFilterOptionsForDashboard,
} from "@/lib/dashboard-filter-options";
import { getClientRequests } from "@/lib/dashboard-queries";
import { getServiceTypeLabels, getStatusLabels } from "@/lib/i18n/labels";
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
  const serviceTypeLabels = getServiceTypeLabels(t);
  const statusLabels = getStatusLabels(t);

  return (
    <div className="space-y-6">
      <div>
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
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold">{t.dashboard.client.orders}</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">
              {allOrders.length === 0
                ? t.common.noData
                : t.common.noResultsFiltered}
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/client/track/${order.tracking_token}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-primary/5"
                >
                  <div>
                    <p className="font-semibold">
                      {serviceTypeLabels[order.service_type]}
                    </p>
                    <p className="text-xs text-muted" dir="ltr">
                      {order.tracking_token}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {statusLabels[order.status as keyof typeof statusLabels]}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
