import Link from "next/link";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getClientOrderSearchPlaceholder,
  getStatusFilterOptionsForDashboard,
} from "@/lib/dashboard-filter-options";
import { getClientRequests } from "@/lib/dashboard-queries";
import { getIntlLocale } from "@/lib/i18n/config";
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

export default async function ClientOrdersPage({ searchParams }: PageProps) {
  const { t, locale } = await getServerI18n();
  const params = parseListFilters(await searchParams);
  const allOrders = await getClientRequests();
  const orders = filterServiceRequests(allOrders, params);
  const statusLabels = getStatusLabels(t);
  const serviceTypeLabels = getServiceTypeLabels(t);
  const executionMethodLabels = getExecutionMethodLabels(t);
  const intlLocale = getIntlLocale(locale);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t.dashboard.client.orders}</h1>
        <Link
          href="/client/request"
          className="text-sm font-semibold text-primary hover:underline"
        >
          + {t.dashboard.client.newRequest}
        </Link>
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

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-semibold">
                  {serviceTypeLabels[order.service_type]}
                </p>
                <p className="text-sm text-muted">
                  {executionMethodLabels[order.execution_method]} ·{" "}
                  {order.location_text ?? t.common.dash}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {new Date(order.created_at).toLocaleString(intlLocale)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {statusLabels[order.status as keyof typeof statusLabels]}
                </Badge>
                <Link
                  href={`/client/orders/${order.id}`}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {t.common.details}
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {orders.length === 0 && (
          <p className="text-muted">
            {allOrders.length === 0 ? (
              <>
                {t.common.noData}.{" "}
                <Link href="/client/request" className="text-primary">
                  {t.dashboard.client.newRequest}
                </Link>
              </>
            ) : (
              t.common.noResultsFiltered
            )}
          </p>
        )}
      </div>
    </div>
  );
}
