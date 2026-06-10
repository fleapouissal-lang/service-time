import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminSparePartOrderEditForm } from "@/components/admin/admin-spare-part-order-edit-form";
import { Card, CardContent } from "@/components/ui/card";
import {
  buildSparePartOrderStatusOptionsForDashboard,
  getSparePartOrderStatusLabelsForDashboard,
  getSparePartPaymentMethodLabelsForDashboard,
  getSparePartPaymentStatusLabelsForDashboard,
} from "@/lib/spare-part-order-labels";
import { getAdminSparePartOrderById } from "@/lib/spare-part-orders-queries";
import { getServerI18n } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminSparePartOrderDetailPage({ params }: PageProps) {
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.sparePartOrdersPage;
  const { id } = await params;
  const order = await getAdminSparePartOrderById(id);

  if (!order) notFound();

  const statusLabels = getSparePartOrderStatusLabelsForDashboard(t);
  const paymentMethodLabels = getSparePartPaymentMethodLabelsForDashboard(t);
  const paymentStatusLabels = getSparePartPaymentStatusLabelsForDashboard(t);
  const statusOptions = buildSparePartOrderStatusOptionsForDashboard(t);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/spare-part-orders"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowRight className="size-4 rotate-180" aria-hidden />
          {p.backToList}
        </Link>
        <DashboardPageHeader title={p.editOrder}>
          <p className="font-mono text-sm text-muted" dir="ltr">
            {order.order_token}
          </p>
        </DashboardPageHeader>
      </div>

      <Card>
        <CardContent className="p-6">
          <AdminSparePartOrderEditForm
            order={order}
            statusOptions={statusOptions}
            statusLabels={statusLabels}
            paymentMethodLabels={paymentMethodLabels}
            paymentStatusLabels={paymentStatusLabels}
          />
        </CardContent>
      </Card>
    </div>
  );
}
