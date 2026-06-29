import Link from "next/link";
import { Suspense } from "react";
import { ClientNewOrderSection } from "@/components/client/client-new-order-section";
import { ClientOrdersTable } from "@/components/client/client-orders-table";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import {
  getClientOrderSearchPlaceholder,
  getStatusFilterOptionsForDashboard,
} from "@/lib/dashboard-filter-options";
import { getClientRequests } from "@/lib/dashboard-queries";
import {
  getRequestPhotosByRequestIds,
  requestPhotoCountsFromMap,
} from "@/lib/request-photos-queries";
import { getClientVehicles } from "@/lib/client-vehicles";
import {
  getExecutionMethodLabels,
  getServiceTypeLabels,
  getStatusLabels,
} from "@/lib/i18n/labels";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import { getServerI18n } from "@/lib/i18n/server";
import { filterServiceRequests, parseListFilters } from "@/lib/list-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ClientOrdersPage({ searchParams }: PageProps) {
  const { t, locale } = await getServerI18n();
  const p = t.dashboard.client.ordersPage;
  const profile = await requireProfile(["client"]);
  const params = parseListFilters(await searchParams);
  const allOrders = await getClientRequests();
  const savedVehicles = profile ? await getClientVehicles(profile.id) : [];
  const orders = filterServiceRequests(allOrders, params);
  const photosByRequestId = await getRequestPhotosByRequestIds(
    orders.map((order) => order.id),
  );
  const photoCounts = requestPhotoCountsFromMap(photosByRequestId);
  const statusLabels = getStatusLabels(t);
  const serviceTypeLabels = getServiceTypeLabels(t);
  const executionMethodLabels = getExecutionMethodLabels(t);

  return (
    <div className="mx-auto w-[90%] max-w-[1200px] space-y-6 pb-16">
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold">{t.dashboard.client.orders}</h1>
        <p className="text-muted">{p.subtitle}</p>
      </div>

      <DashboardFilterBar
        pathname="/client/orders"
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

      <Suspense>
        <ClientNewOrderSection
          defaultName={
            profile ? getProfileDisplayName(profile, locale) : ""
          }
          defaultPhone={profile?.phone ?? ""}
          savedVehicles={savedVehicles}
        />
      </Suspense>

      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              {allOrders.length === 0 ? (
                <>
                  {t.common.noData}.{" "}
                  <Link href="/client/request" className="font-semibold text-primary hover:underline">
                    {t.dashboard.client.newRequest}
                  </Link>
                </>
              ) : (
                t.common.noResultsFiltered
              )}
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
