import Link from "next/link";
import { ClientNewSparePartOrderSection } from "@/components/client/client-new-spare-part-order-section";
import { ClientSparePartOrdersTable } from "@/components/client/client-spare-part-orders-table";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { getClientSparePartOrderSearchPlaceholder } from "@/lib/dashboard-filter-options";
import {
  getSparePartOrderStatusFilterOptionsForDashboard,
  getSparePartOrderStatusLabelsForDashboard,
  getSparePartPaymentMethodLabelsForDashboard,
  getSparePartPaymentStatusLabelsForDashboard,
} from "@/lib/spare-part-order-labels";
import { getServerI18n } from "@/lib/i18n/server";
import { filterSparePartOrders, parseListFilters } from "@/lib/list-filters";
import { getClientSparePartOrdersWithItems } from "@/lib/spare-part-orders-queries";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ClientSparePartOrdersPage({
  searchParams,
}: PageProps) {
  const { t } = await getServerI18n();
  const p = t.dashboard.client.sparePartOrdersPage;
  const profile = await requireProfile(["client"]);
  if (!profile) return null;

  const params = parseListFilters(await searchParams);
  const allOrders = await getClientSparePartOrdersWithItems(profile.id);
  const orders = filterSparePartOrders(allOrders, params);
  const statusLabels = getSparePartOrderStatusLabelsForDashboard(t);
  const paymentMethodLabels = getSparePartPaymentMethodLabelsForDashboard(t);
  const paymentStatusLabels = getSparePartPaymentStatusLabelsForDashboard(t);

  return (
    <div className="mx-auto w-[90%] max-w-[1200px] space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard.client.sparePartOrders}</h1>
        <p className="text-muted">{p.subtitle}</p>
      </div>

      <DashboardFilterBar
        pathname="/client/spare-part-orders"
        values={params}
        searchPlaceholder={getClientSparePartOrderSearchPlaceholder(t)}
        selects={[
          {
            name: "status",
            label: t.common.status,
            options: getSparePartOrderStatusFilterOptionsForDashboard(t),
          },
        ]}
        resultCount={orders.length}
        totalCount={allOrders.length}
      />

      <ClientNewSparePartOrderSection />

      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              {allOrders.length === 0 ? (
                <>
                  {t.common.noData}.{" "}
                  <Link
                    href="/spare-parts"
                    className="font-semibold text-primary hover:underline"
                  >
                    {t.spareParts.browseParts}
                  </Link>
                </>
              ) : (
                t.common.noResultsFiltered
              )}
            </p>
          ) : (
            <ClientSparePartOrdersTable
              orders={orders}
              statusLabels={statusLabels}
              paymentMethodLabels={paymentMethodLabels}
              paymentStatusLabels={paymentStatusLabels}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
