"use client";

import type { ServiceRequest, ServiceRequestStatus } from "@service-time/types";
import { DashboardTablePagination } from "@/components/dashboard/dashboard-table-pagination";
import { useDashboardTablePagination } from "@/hooks/use-dashboard-table-pagination";
import { getIntlLocale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/locale-context";

type AdminOverviewOrdersTableProps = {
  orders: ServiceRequest[];
  statusLabels: Record<ServiceRequestStatus, string>;
};

export function AdminOverviewOrdersTable({
  orders,
  statusLabels,
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-right text-muted">
              <th className="pb-2 font-medium">
                {t.dashboard.admin.ordersTable.customer}
              </th>
              <th className="pb-2 font-medium">
                {t.dashboard.admin.ordersTable.status}
              </th>
              <th className="pb-2 font-medium">
                {t.dashboard.admin.ordersTable.priority}
              </th>
              <th className="pb-2 font-medium">
                {t.dashboard.admin.ordersTable.date}
              </th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((order) => (
              <tr key={order.id} className="border-b border-border">
                <td className="py-3 font-medium">{order.customer_name}</td>
                <td className="py-3">
                  {statusLabels[order.status as ServiceRequestStatus]}
                </td>
                <td className="py-3 text-muted">{order.priority}</td>
                <td className="py-3 text-muted">
                  {new Date(order.created_at).toLocaleDateString(intlLocale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
