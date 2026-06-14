"use client";

import { Eye } from "lucide-react";
import { useState } from "react";
import type { SparePartOrderWithItems } from "@/lib/spare-part-orders-queries";
import {
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeadCell,
} from "@/components/admin/admin-table";
import { DashboardDetailDialog } from "@/components/dashboard/dashboard-detail-dialog";
import { DashboardTablePagination } from "@/components/dashboard/dashboard-table-pagination";
import { Badge } from "@/components/ui/badge";
import { useDashboardTablePagination } from "@/hooks/use-dashboard-table-pagination";
import { formatSparePartPrice, getLineTotal } from "@/lib/format-price";
import { getIntlLocale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/locale-context";
import type {
  SparePartOrderStatus,
  SparePartPaymentMethod,
  SparePartPaymentStatus,
} from "@service-time/types";

type ClientSparePartOrdersTableProps = {
  orders: SparePartOrderWithItems[];
  statusLabels: Record<SparePartOrderStatus, string>;
  paymentMethodLabels: Record<SparePartPaymentMethod, string>;
  paymentStatusLabels: Record<SparePartPaymentStatus, string>;
};

const actionBtnClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-primary/5 hover:text-primary";

export function ClientSparePartOrdersTable({
  orders,
  statusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
}: ClientSparePartOrdersTableProps) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.client.sparePartOrdersPage;
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
  const [viewTarget, setViewTarget] = useState<SparePartOrderWithItems | null>(null);

  return (
    <>
      <AdminTable className="min-w-[880px]">
        <AdminTableHead>
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
          <AdminTableHeadCell align="center" className="w-20">
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
            return (
              <tr key={order.id} className="border-b border-border">
                <AdminTableCell ltr className="min-w-[7rem]">
                  <span
                    className="mx-auto block max-w-[7rem] truncate font-mono text-xs font-semibold"
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
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {statusLabels[order.status]}
                  </Badge>
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
                <AdminTableCell align="center" className="w-20">
                  <button
                    type="button"
                    onClick={() => setViewTarget(order)}
                    className={actionBtnClass}
                    title={p.table.view}
                    aria-label={p.table.view}
                  >
                    <Eye className="size-4" aria-hidden />
                  </button>
                </AdminTableCell>
              </tr>
            );
          })}
        </tbody>
      </AdminTable>

      <DashboardDetailDialog
        open={Boolean(viewTarget)}
        title={viewTarget?.order_token ?? ""}
        onClose={() => setViewTarget(null)}
        closeLabel={t.common.close}
        fields={
          viewTarget
            ? [
                {
                  label: p.table.orderToken,
                  value: viewTarget.order_token,
                  ltr: true,
                  fullWidth: true,
                },
                {
                  label: t.common.status,
                  value: (
                    <Badge variant="secondary">{statusLabels[viewTarget.status]}</Badge>
                  ),
                },
                {
                  label: p.table.payment,
                  value: (
                    <>
                      <span className="block">{paymentMethodLabels[viewTarget.payment_method]}</span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {paymentStatusLabels[viewTarget.payment_status]}
                      </span>
                    </>
                  ),
                },
                {
                  label: p.table.total,
                  value: formatSparePartPrice(
                    viewTarget.items.reduce(
                      (sum, item) =>
                        sum +
                        getLineTotal(Number(item.price_snapshot) || 0, item.quantity),
                      0,
                    ),
                    locale,
                  ),
                  ltr: true,
                },
                {
                  label: p.table.date,
                  value: new Date(viewTarget.created_at).toLocaleString(intlLocale, {
                    dateStyle: "short",
                    timeStyle: "short",
                  }),
                  ltr: true,
                },
                ...(viewTarget.delivery_address
                  ? [
                      {
                        label: t.spareParts.deliveryAddress,
                        value: viewTarget.delivery_address,
                        fullWidth: true,
                      },
                    ]
                  : []),
              ]
            : []
        }
      >
        {viewTarget && viewTarget.items.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold">{t.common.products}</p>
            <ul className="space-y-2">
              {viewTarget.items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-border p-3 text-sm"
                >
                  <p className="font-medium">{item.name_snapshot}</p>
                  {item.category_snapshot ? (
                    <p className="text-muted">{item.category_snapshot}</p>
                  ) : null}
                  <p className="mt-1 text-muted" dir="ltr">
                    {formatSparePartPrice(Number(item.price_snapshot) || 0, locale)} ×{" "}
                    {item.quantity}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </DashboardDetailDialog>

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
