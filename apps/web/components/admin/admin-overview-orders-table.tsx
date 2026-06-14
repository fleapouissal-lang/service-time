"use client";

import type {
  RequestPriority,
  ServiceRequest,
  ServiceRequestStatus,
} from "@service-time/types";
import {
  AdminTable,
  AdminTableCell,
  AdminTableCustomerInfo,
  AdminTableHead,
  AdminTableHeadCell,
} from "@/components/admin/admin-table";
import { DashboardTablePagination } from "@/components/dashboard/dashboard-table-pagination";
import { Badge } from "@/components/ui/badge";
import { useDashboardTablePagination } from "@/hooks/use-dashboard-table-pagination";
import { getIntlLocale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/locale-context";

type AdminOverviewOrdersTableProps = {
  orders: ServiceRequest[];
  statusLabels: Record<ServiceRequestStatus, string>;
  priorityLabels: Record<RequestPriority, string>;
};

export function AdminOverviewOrdersTable({
  orders,
  statusLabels,
  priorityLabels,
}: AdminOverviewOrdersTableProps) {
  const { locale, messages: t } = useLocale();
  const intlLocale = getIntlLocale(locale);
  const {
    pageItems,
    setPage,
    page,
    totalPages,
    totalItems,
    from,
    to,
  } = useDashboardTablePagination(orders);

  return (
    <>
      <AdminTable className="min-w-[640px]">
        <AdminTableHead>
          <AdminTableHeadCell className="min-w-[11rem]">
            {t.dashboard.admin.ordersTable.customer}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center">
            {t.dashboard.admin.ordersTable.status}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center">
            {t.dashboard.admin.ordersTable.priority}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[9rem]">
            {t.dashboard.admin.ordersTable.date}
          </AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {pageItems.map((order) => (
            <tr key={order.id} className="border-b border-border">
              <AdminTableCell className="min-w-[11rem]">
                <AdminTableCustomerInfo
                  name={order.customer_name}
                  phone={order.customer_phone}
                />
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
              <AdminTableCell align="center" ltr className="min-w-[9rem]">
                {new Date(order.created_at).toLocaleDateString(intlLocale, {
                  dateStyle: "short",
                })}
              </AdminTableCell>
            </tr>
          ))}
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
    </>
  );
}
