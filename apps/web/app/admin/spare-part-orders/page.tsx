import { AdminSparePartOrdersTable } from "@/components/admin/admin-spare-part-orders-table";
import { Card, CardContent } from "@/components/ui/card";
import {
  getSparePartOrderStatusLabelsForDashboard,
  getSparePartPaymentMethodLabelsForDashboard,
  getSparePartPaymentStatusLabelsForDashboard,
} from "@/lib/spare-part-order-labels";
import { getAdminSparePartOrders } from "@/lib/spare-part-orders-queries";
import { getServerI18n } from "@/lib/i18n/server";

export default async function AdminSparePartOrdersPage() {
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.sparePartOrdersPage;
  const orders = await getAdminSparePartOrders();
  const statusLabels = getSparePartOrderStatusLabelsForDashboard(t);
  const paymentMethodLabels = getSparePartPaymentMethodLabelsForDashboard(t);
  const paymentStatusLabels = getSparePartPaymentStatusLabelsForDashboard(t);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard.admin.sparePartOrders}</h1>
        <p className="text-muted">{p.subtitle}</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{t.common.noData}</p>
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
