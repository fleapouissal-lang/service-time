import Link from "next/link";
import { LocationTracker } from "@/components/technician/location-tracker";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getOrderSearchPlaceholder,
  getStatusFilterOptionsForDashboard,
} from "@/lib/dashboard-filter-options";
import { requireProfile } from "@/lib/auth";
import { getTechnicianRequests } from "@/lib/dashboard-queries";
import {
  getExecutionMethodLabels,
  getServiceTypeLabels,
  getStatusLabels,
} from "@/lib/i18n/labels";
import { getServerI18n } from "@/lib/i18n/server";
import { filterServiceRequests, parseListFilters } from "@/lib/list-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function TechnicianLocationPage({
  searchParams,
}: PageProps) {
  const { t } = await getServerI18n();
  const profile = await requireProfile(["technician"]);
  if (!profile) return null;

  const params = parseListFilters(await searchParams);
  const allOrders = await getTechnicianRequests(profile.id);
  const orders = filterServiceRequests(allOrders, params).filter(
    (o) => o.status !== "completed" && o.status !== "cancelled",
  );
  const serviceTypeLabels = getServiceTypeLabels(t);
  const executionMethodLabels = getExecutionMethodLabels(t);
  const statusLabels = getStatusLabels(t);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <DashboardPageHeader title={t.dashboard.technician.locationPage.title} />

      <DashboardFilterBar
        pathname="/technician/location"
        values={params}
        searchPlaceholder={getOrderSearchPlaceholder(t)}
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

      <Card>
        <CardContent className="p-6">
          <p className="mb-4 text-sm text-muted">
            {t.dashboard.technician.locationPage.shareHint}
          </p>
          <LocationTracker active />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold">{t.dashboard.technician.locationPage.activeOrders}</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">{t.dashboard.technician.locationPage.noActiveOrders}</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/technician/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-primary/5"
                >
                  <div>
                    <p className="font-semibold">{order.customer_name}</p>
                    <p className="text-sm text-muted">
                      {serviceTypeLabels[order.service_type]} ·{" "}
                      {executionMethodLabels[order.execution_method]}
                    </p>
                    <p className="mt-1 text-sm">{order.location_text ?? t.common.dash}</p>
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
