import { Suspense } from "react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminSparePartOrdersTable } from "@/components/admin/admin-spare-part-orders-table";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminSparePartOrderSearchPlaceholder } from "@/lib/dashboard-filter-options";
import {
  getSparePartOrderStatusFilterOptionsForDashboard,
  getSparePartOrderStatusLabelsForDashboard,
  getSparePartPaymentMethodLabelsForDashboard,
  getSparePartPaymentStatusLabelsForDashboard,
} from "@/lib/spare-part-order-labels";
import { getAdminSparePartOrders } from "@/lib/spare-part-orders-queries";
import { getServerI18n } from "@/lib/i18n/server";
import { filterSparePartOrders, parseListFilters } from "@/lib/list-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminSparePartOrdersPage({
  searchParams,
}: PageProps) {
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.sparePartOrdersPage;
  const params = parseListFilters(await searchParams);
  const allOrders = await getAdminSparePartOrders();
  const orders = filterSparePartOrders(allOrders, params);
  const statusLabels = getSparePartOrderStatusLabelsForDashboard(t);
  const paymentMethodLabels = getSparePartPaymentMethodLabelsForDashboard(t);
  const paymentStatusLabels = getSparePartPaymentStatusLabelsForDashboard(t);

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={t.dashboard.admin.sparePartOrders}>
        <p className="text-muted">{p.subtitle}</p>
      </DashboardPageHeader>

      <Suspense>
        <DashboardFilterBar
          pathname="/admin/spare-part-orders"
          values={params}
          searchPlaceholder={getAdminSparePartOrderSearchPlaceholder(t)}
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
      </Suspense>

      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              {allOrders.length === 0
                ? t.common.noData
                : t.common.noResultsFiltered}
            </p>
          ) : (
            <AdminSparePartOrdersTable
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
