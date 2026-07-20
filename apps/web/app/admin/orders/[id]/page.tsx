import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminOrderDeleteButton } from "@/components/admin/admin-order-delete-button";
import { AdminOrderUpdateForm } from "@/components/admin/admin-order-update-form";
import { AdminQuotePanel } from "@/components/admin/admin-quote-panel";
import { AdminServicePaymentPanel } from "@/components/admin/admin-service-payment-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getRequestById,
  getTechnicians,
} from "@/lib/dashboard-queries";
import { getRequestPhotos } from "@/lib/request-photos-queries";
import { ServiceRequestPhotosPanel } from "@/components/service-requests/service-request-photos-panel";
import {
  getServiceTypeLabels,
  getStatusLabels,
  getPriorityLabels,
} from "@/lib/i18n/labels";
import { formatDateTime } from "@/lib/format-datetime";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import { getServerI18n } from "@/lib/i18n/server";
import { isQuotePending } from "@/lib/suggest-service-price";
import { isPaymentBlockingAssignment } from "@/lib/service-request-payment";
import {
  buildPrioritySelectOptions,
  buildStatusSelectOptions,
  buildTechnicianAssignOptions,
} from "@/lib/select-option-builders";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { t, locale } = await getServerI18n();
  const p = t.dashboard.admin.ordersPage;
  const { id } = await params;
  const [order, technicians, photos] = await Promise.all([
    getRequestById(id),
    getTechnicians(),
    getRequestPhotos(id),
  ]);

  if (!order) notFound();

  const statusLabels = getStatusLabels(t);
  const serviceTypeLabels = getServiceTypeLabels(t);
  const priorityLabels = getPriorityLabels(t);
  const statusOptions = buildStatusSelectOptions(t);
  const priorityOptions = buildPrioritySelectOptions(t);
  const technicianOptions = buildTechnicianAssignOptions(t, technicians, locale);

  const assignedTechnician = technicians.find(
    (tech) => tech.id === order.assigned_technician_id,
  );
  const quotePending = isQuotePending(order);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/orders"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowRight className="size-4 rotate-180" aria-hidden />
          {p.backToList}
        </Link>
        <DashboardPageHeader title={p.editOrder}>
          <p className="font-mono text-sm text-muted" dir="ltr">
            {order.tracking_token}
          </p>
        </DashboardPageHeader>
      </div>

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs font-medium text-muted">{p.detail.customer}</p>
              <p className="mt-1 font-semibold">{order.customer_name}</p>
              <p className="mt-0.5 text-sm text-muted" dir="ltr">
                {order.customer_phone}
              </p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs font-medium text-muted">{p.detail.date}</p>
              <p className="mt-1 text-sm" dir="ltr">
                {formatDateTime(order.created_at, locale)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs font-medium text-muted">{p.detail.service}</p>
              <p className="mt-1 text-sm">{serviceTypeLabels[order.service_type]}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs font-medium text-muted">{p.detail.car}</p>
              <p className="mt-1 text-sm">{order.car_type ?? t.common.dash}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs font-medium text-muted">{p.detail.technician}</p>
              <p className="mt-1 text-sm">
                {assignedTechnician
                  ? getProfileDisplayName(assignedTechnician, locale)
                  : t.common.dash}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {statusLabels[order.status as keyof typeof statusLabels]}
            </Badge>
            <Badge variant="outline">
              {priorityLabels[order.priority as keyof typeof priorityLabels]}
            </Badge>
          </div>

          {order.location_text ? (
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs font-medium text-muted">{p.detail.location}</p>
              <p className="mt-1 text-sm">{order.location_text}</p>
              {order.location_lat != null && order.location_lng != null ? (
                <p className="mt-1 font-mono text-xs text-muted" dir="ltr">
                  {order.location_lat.toFixed(5)}, {order.location_lng.toFixed(5)}
                </p>
              ) : null}
            </div>
          ) : null}

          {order.description ? (
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs font-medium text-muted">{t.common.description}</p>
              <p className="mt-1 text-sm">{order.description}</p>
            </div>
          ) : null}

          <ServiceRequestPhotosPanel requestId={order.id} photos={photos} />

          <AdminQuotePanel order={order} />

          <AdminServicePaymentPanel order={order} />

          <div>
            <p className="mb-3 text-sm font-semibold">{p.detail.updateOrder}</p>
            <AdminOrderUpdateForm
              orderId={order.id}
              status={order.status}
              priority={order.priority}
              assignedTechnicianId={order.assigned_technician_id ?? ""}
              locationText={order.location_text}
              locationLat={order.location_lat}
              locationLng={order.location_lng}
              statusOptions={statusOptions}
              priorityOptions={priorityOptions}
              technicianOptions={technicianOptions}
              quotePending={quotePending}
              paymentBlocking={isPaymentBlockingAssignment(order)}
            />
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <AdminOrderDeleteButton
              orderId={order.id}
              customerName={order.customer_name}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
