"use client";

import type { ServiceRequest } from "@service-time/types";
import { useState, useTransition } from "react";
import { deleteAdminOrderAction } from "@/app/admin/actions";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminTable, AdminTableCell, AdminTableCustomerInfo, AdminTableHead, AdminTableHeadCell } from "@/components/admin/admin-table";
import { AdminTableActions } from "@/components/admin/admin-table-actions";
import { DashboardDetailDialog } from "@/components/dashboard/dashboard-detail-dialog";
import { DashboardTablePagination } from "@/components/dashboard/dashboard-table-pagination";
import { ServiceRequestPhotosGallery } from "@/components/service-requests/service-request-photos-panel";
import { Badge } from "@/components/ui/badge";
import { useDashboardTablePagination } from "@/hooks/use-dashboard-table-pagination";
import { formatDateTime } from "@/lib/format-datetime";
import { useLocale } from "@/lib/i18n/locale-context";
import type { RequestPhotoRow } from "@/lib/request-photos-queries";
import type { ServiceRequestStatus, RequestPriority, ServiceType } from "@service-time/types";

type AdminOrdersTableProps = {
  orders: ServiceRequest[];
  photoCounts: Record<string, number>;
  photosByRequestId: Record<string, RequestPhotoRow[]>;
  statusLabels: Record<ServiceRequestStatus, string>;
  serviceTypeLabels: Record<ServiceType, string>;
  priorityLabels: Record<RequestPriority, string>;
};

export function AdminOrdersTable({
  orders,
  photoCounts,
  photosByRequestId,
  statusLabels,
  serviceTypeLabels,
  priorityLabels,
}: AdminOrdersTableProps) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.admin.ordersPage;
  const [deleteTarget, setDeleteTarget] = useState<ServiceRequest | null>(null);
  const [viewTarget, setViewTarget] = useState<ServiceRequest | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    pageItems,
    setPage,
    page,
    totalPages,
    totalItems,
    from,
    to,
  } = useDashboardTablePagination(orders);

  const handleDelete = () => {
    if (!deleteTarget) return;
    const formData = new FormData();
    formData.set("id", deleteTarget.id);
    startTransition(async () => {
      await deleteAdminOrderAction(formData);
    });
  };

  return (
    <>
      <AdminTable>
        <AdminTableHead>
          <AdminTableHeadCell className="min-w-[11rem]">{p.table.customer}</AdminTableHeadCell>
          <AdminTableHeadCell>{p.table.service}</AdminTableHeadCell>
          <AdminTableHeadCell align="center">{t.common.status}</AdminTableHeadCell>
          <AdminTableHeadCell align="center">{t.common.priority}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[7rem]">
            {p.table.tracking}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center">{p.table.photo}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[9rem]">
            {p.table.date}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="w-36">
            {p.table.actions}
          </AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {pageItems.map((order) => {
            const detailHref = `/admin/orders/${order.id}`;

            return (
              <tr key={order.id} className="border-b border-border">
                <AdminTableCell className="min-w-[11rem]">
                  <AdminTableCustomerInfo
                    name={order.customer_name}
                    phone={order.customer_phone}
                  />
                </AdminTableCell>
                <AdminTableCell className="text-muted">
                  {serviceTypeLabels[order.service_type]}
                </AdminTableCell>
                <AdminTableCell align="center">
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {statusLabels[order.status as ServiceRequestStatus]}
                  </Badge>
                </AdminTableCell>
                <AdminTableCell align="center">
                  <Badge variant="outline" className="whitespace-nowrap">
                    {priorityLabels[order.priority as RequestPriority]}
                  </Badge>
                </AdminTableCell>
                <AdminTableCell ltr className="min-w-[7rem]">
                  <span
                    className="mx-auto block max-w-[7rem] truncate font-mono text-xs"
                    title={order.tracking_token}
                  >
                    {order.tracking_token}
                  </span>
                </AdminTableCell>
                <AdminTableCell align="center">
                  {(photoCounts[order.id] ?? 0) > 0 ? (
                    <Badge variant="secondary">{t.common.yes}</Badge>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </AdminTableCell>
                <AdminTableCell ltr className="min-w-[9rem]">
                  {formatDateTime(order.created_at, locale)}
                </AdminTableCell>
                <AdminTableCell align="center" className="w-36">
                  <AdminTableActions
                    onView={() => setViewTarget(order)}
                    editHref={detailHref}
                    viewLabel={p.table.view}
                    editLabel={p.table.edit}
                    deleteLabel={t.common.delete}
                    onDelete={() => setDeleteTarget(order)}
                    className="justify-center"
                  />
                </AdminTableCell>
              </tr>
            );
          })}
        </tbody>
      </AdminTable>

      <DashboardTablePagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        from={from}
        to={to}
        onPageChange={setPage}
      />

      <DashboardDetailDialog
        open={Boolean(viewTarget)}
        title={viewTarget?.customer_name ?? ""}
        onClose={() => setViewTarget(null)}
        closeLabel={t.common.close}
        fields={
          viewTarget
            ? [
                {
                  label: p.detail.customer,
                  value: (
                    <>
                      <span className="block font-semibold">{viewTarget.customer_name}</span>
                      <span className="mt-0.5 block text-muted" dir="ltr">
                        {viewTarget.customer_phone}
                      </span>
                    </>
                  ),
                  fullWidth: true,
                },
                {
                  label: p.detail.service,
                  value: serviceTypeLabels[viewTarget.service_type],
                },
                {
                  label: t.common.status,
                  value: (
                    <Badge variant="secondary">
                      {statusLabels[viewTarget.status as ServiceRequestStatus]}
                    </Badge>
                  ),
                },
                {
                  label: t.common.priority,
                  value: (
                    <Badge variant="outline">
                      {priorityLabels[viewTarget.priority as RequestPriority]}
                    </Badge>
                  ),
                },
                {
                  label: p.table.tracking,
                  value: viewTarget.tracking_token,
                  ltr: true,
                },
                {
                  label: p.detail.date,
                  value: formatDateTime(viewTarget.created_at, locale),
                  ltr: true,
                },
                ...(viewTarget.car_type
                  ? [{ label: p.detail.car, value: viewTarget.car_type }]
                  : []),
                ...(viewTarget.location_text
                  ? [
                      {
                        label: p.detail.location,
                        value: viewTarget.location_text,
                        fullWidth: true,
                      },
                    ]
                  : []),
                ...(viewTarget.description
                  ? [
                      {
                        label: t.common.description,
                        value: viewTarget.description,
                        fullWidth: true,
                      },
                    ]
                  : []),
                ...((photosByRequestId[viewTarget.id] ?? []).length > 0
                  ? [
                      {
                        label: p.table.photo,
                        value: (
                          <ServiceRequestPhotosGallery
                            requestId={viewTarget.id}
                            photos={photosByRequestId[viewTarget.id] ?? []}
                          />
                        ),
                        fullWidth: true,
                      },
                    ]
                  : []),
              ]
            : []
        }
      />

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title={p.deleteConfirmTitle}
        message={
          deleteTarget
            ? p.deleteConfirmMessage.replace("{name}", deleteTarget.customer_name)
            : ""
        }
        cancelLabel={t.common.cancel}
        confirmLabel={t.common.delete}
        loadingLabel={t.common.loading}
        pending={pending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
