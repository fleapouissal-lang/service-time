"use client";

import type { SparePartOrderWithItems } from "@/lib/spare-part-orders-queries";
import { AdminTable, AdminTableCell, AdminTableCustomerInfo, AdminTableHead, AdminTableHeadCell } from "@/components/admin/admin-table";
import { AdminTableActions } from "@/components/admin/admin-table-actions";
import { DashboardTablePagination } from "@/components/dashboard/dashboard-table-pagination";
import { Badge } from "@/components/ui/badge";
import { formatSparePartPrice, getLineTotal } from "@/lib/format-price";
import { getIntlLocale } from "@/lib/i18n/config";
import { useDashboardTablePagination } from "@/hooks/use-dashboard-table-pagination";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import { useLocale } from "@/lib/i18n/locale-context";
import type {
  SparePartOrderStatus,
  SparePartPaymentMethod,
  SparePartPaymentStatus,
} from "@service-time/types";

type AdminSparePartOrdersTableProps = {
  orders: SparePartOrderWithItems[];
  statusLabels: Record<SparePartOrderStatus, string>;
  paymentMethodLabels: Record<SparePartPaymentMethod, string>;
  paymentStatusLabels: Record<SparePartPaymentStatus, string>;
};

export function AdminSparePartOrdersTable({
  orders,
  statusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
}: AdminSparePartOrdersTableProps) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.admin.sparePartOrdersPage;
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
      <AdminTable>
      <AdminTableHead>
        <AdminTableHeadCell className="min-w-[11rem]">{p.table.client}</AdminTableHeadCell>
        <AdminTableHeadCell align="center" className="min-w-[7rem]">
          {p.table.orderToken}
        </AdminTableHeadCell>
        <AdminTableHeadCell align="center">{p.table.items}</AdminTableHeadCell>
        <AdminTableHeadCell align="center" className="min-w-[7rem]">
          {p.table.total}
        </AdminTableHeadCell>
        <AdminTableHeadCell align="center">{t.common.status}</AdminTableHeadCell>
        <AdminTableHeadCell>{p.table.payment}</AdminTableHeadCell>
        <AdminTableHeadCell align="center" className="min-w-[9rem]">
          {p.table.date}
        </AdminTableHeadCell>
        <AdminTableHeadCell align="center" className="w-28">
          {p.table.actions}
        </AdminTableHeadCell>
      </AdminTableHead>
      <tbody>
        {pageItems.map((order) => {
          const orderTotal = order.items.reduce(
            (sum, item) =>
              sum + getLineTotal(Number(item.price_snapshot) || 0, item.quantity),
            0,
          );
          const detailHref = `/admin/spare-part-orders/${order.id}`;

          return (
            <tr key={order.id} className="border-b border-border">
              <AdminTableCell className="min-w-[11rem]">
                <AdminTableCustomerInfo
                  name={
                    order.client
                      ? getProfileDisplayName(order.client, locale)
                      : t.common.dash
                  }
                  phone={order.client?.phone}
                />
              </AdminTableCell>
              <AdminTableCell ltr className="min-w-[7rem]">
                <span
                  className="mx-auto block max-w-[7rem] truncate font-mono text-xs"
                  title={order.order_token}
                >
                  {order.order_token}
                </span>
              </AdminTableCell>
              <AdminTableCell align="center" ltr>
                {order.items.length}
              </AdminTableCell>
              <AdminTableCell align="center" ltr className="min-w-[7rem]">
                {formatSparePartPrice(orderTotal, locale)}
              </AdminTableCell>
              <AdminTableCell align="center">
                <Badge variant="secondary">{statusLabels[order.status]}</Badge>
              </AdminTableCell>
              <AdminTableCell>
                <span className="block text-sm leading-snug">
                  {paymentMethodLabels[order.payment_method]}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {paymentStatusLabels[order.payment_status]}
                </span>
              </AdminTableCell>
              <AdminTableCell ltr className="min-w-[9rem]">
                {new Date(order.created_at).toLocaleString(intlLocale, {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </AdminTableCell>
              <AdminTableCell align="center" className="w-28">
                <AdminTableActions
                  viewHref={detailHref}
                  editHref={detailHref}
                  viewLabel={p.table.view}
                  editLabel={p.table.edit}
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
    </>
  );
}
