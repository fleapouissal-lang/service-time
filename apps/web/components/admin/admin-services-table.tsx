"use client";

import { useState, useTransition } from "react";
import type { Service, ServiceType } from "@service-time/types";
import { deleteServiceAction } from "@/app/admin/actions";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import {
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeadCell,
} from "@/components/admin/admin-table";
import { AdminTableActions } from "@/components/admin/admin-table-actions";
import { DashboardDetailDialog } from "@/components/dashboard/dashboard-detail-dialog";
import { DashboardTablePagination } from "@/components/dashboard/dashboard-table-pagination";
import { Badge } from "@/components/ui/badge";
import { getServiceDescription, getServiceName } from "@/lib/localized-content";
import { useDashboardTablePagination } from "@/hooks/use-dashboard-table-pagination";
import { useLocale } from "@/lib/i18n/locale-context";

type AdminServicesTableProps = {
  services: Service[];
  serviceTypeLabels: Record<ServiceType, string>;
};

export function AdminServicesTable({
  services,
  serviceTypeLabels,
}: AdminServicesTableProps) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.admin.servicesPage;
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [viewTarget, setViewTarget] = useState<Service | null>(null);
  const [pending, startTransition] = useTransition();
  const {
    pageItems,
    setPage,
    page,
    totalPages,
    totalItems,
    from,
    to,
  } = useDashboardTablePagination(services);

  const handleDelete = () => {
    if (!deleteTarget) return;
    const formData = new FormData();
    formData.set("id", deleteTarget.id);
    startTransition(async () => {
      await deleteServiceAction(formData);
    });
  };

  return (
    <>
      <AdminTable>
        <AdminTableHead>
          <AdminTableHeadCell>{p.table.name}</AdminTableHeadCell>
          <AdminTableHeadCell>{t.common.category}</AdminTableHeadCell>
          <AdminTableHeadCell align="center">{p.table.serviceType}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[4.5rem]">
            {p.table.sortOrder}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center">{t.common.status}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="w-36">
            {p.table.actions}
          </AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {pageItems.map((service) => {
            const name = getServiceName(service, locale);

            return (
              <tr key={service.id} className="border-b border-border">
                <AdminTableCell>
                  <span className="block font-semibold leading-snug">{name}</span>
                </AdminTableCell>
                <AdminTableCell className="text-muted">
                  {service.category ?? t.common.dash}
                </AdminTableCell>
                <AdminTableCell align="center">
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {serviceTypeLabels[service.service_type]}
                  </Badge>
                </AdminTableCell>
                <AdminTableCell ltr className="min-w-[4.5rem]">
                  {service.sort_order}
                </AdminTableCell>
                <AdminTableCell align="center">
                  <Badge variant={service.is_active ? "success" : "outline"}>
                    {service.is_active ? t.common.active : t.common.inactive}
                  </Badge>
                </AdminTableCell>
                <AdminTableCell align="center" className="w-36">
                  <AdminTableActions
                    onView={() => setViewTarget(service)}
                    editHref={`/admin/services/${service.id}`}
                    viewLabel={p.table.view}
                    editLabel={p.table.edit}
                    deleteLabel={t.common.delete}
                    onDelete={() => setDeleteTarget(service)}
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
        title={viewTarget ? getServiceName(viewTarget, locale) : ""}
        onClose={() => setViewTarget(null)}
        closeLabel={t.common.close}
        fields={
          viewTarget
            ? [
                {
                  label: p.table.name,
                  value: getServiceName(viewTarget, locale),
                  fullWidth: true,
                },
                {
                  label: t.common.category,
                  value: viewTarget.category ?? t.common.dash,
                },
                {
                  label: p.table.serviceType,
                  value: (
                    <Badge variant="secondary">
                      {serviceTypeLabels[viewTarget.service_type]}
                    </Badge>
                  ),
                },
                {
                  label: p.table.sortOrder,
                  value: viewTarget.sort_order,
                  ltr: true,
                },
                {
                  label: t.common.status,
                  value: (
                    <Badge variant={viewTarget.is_active ? "success" : "outline"}>
                      {viewTarget.is_active ? t.common.active : t.common.inactive}
                    </Badge>
                  ),
                },
                ...(getServiceDescription(viewTarget, locale)
                  ? [
                      {
                        label: t.common.description,
                        value: getServiceDescription(viewTarget, locale),
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
            ? p.deleteConfirmMessage.replace(
                "{name}",
                getServiceName(deleteTarget, locale),
              )
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
