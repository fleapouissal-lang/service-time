"use client";

import type { ServiceRequest } from "@service-time/types";
import { useState, useTransition } from "react";
import { deleteAdminOrderAction } from "@/app/admin/actions";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminTable, AdminTableCell, AdminTableCustomerInfo, AdminTableHead, AdminTableHeadCell } from "@/components/admin/admin-table";
import { AdminTableActions } from "@/components/admin/admin-table-actions";
import { DashboardTablePagination } from "@/components/dashboard/dashboard-table-pagination";
import { Badge } from "@/components/ui/badge";
import { useDashboardTablePagination } from "@/hooks/use-dashboard-table-pagination";
import { getIntlLocale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/locale-context";
import type { ServiceRequestStatus, RequestPriority, ServiceType } from "@service-time/types";

type AdminOrdersTableProps = {
  orders: ServiceRequest[];
  statusLabels: Record<ServiceRequestStatus, string>;
  serviceTypeLabels: Record<ServiceType, string>;
  priorityLabels: Record<RequestPriority, string>;
};

export function AdminOrdersTable({
  orders,
  statusLabels,
  serviceTypeLabels,
  priorityLabels,
}: AdminOrdersTableProps) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.admin.ordersPage;
  const intlLocale = getIntlLocale(locale);
  const [deleteTarget, setDeleteTarget] = useState<ServiceRequest | null>(null);
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
                <AdminTableCell ltr className="min-w-[9rem]">
                  {new Date(order.created_at).toLocaleString(intlLocale, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </AdminTableCell>
                <AdminTableCell align="center" className="w-36">
                  <AdminTableActions
                    viewHref={detailHref}
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
