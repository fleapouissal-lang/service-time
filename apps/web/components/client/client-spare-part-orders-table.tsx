"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import type { SparePartOrderWithItems } from "@/lib/spare-part-orders-queries";
import {
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeadCell,
} from "@/components/admin/admin-table";
import { Badge } from "@/components/ui/badge";
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

  return (
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
        {orders.map((order) => {
          const orderTotal = order.items.reduce(
            (sum, item) =>
              sum + getLineTotal(Number(item.price_snapshot) || 0, item.quantity),
            0,
          );
          const detailHref = `/client/spare-part-orders/${order.id}`;

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
                <Link
                  href={detailHref}
                  className={actionBtnClass}
                  title={p.table.view}
                  aria-label={p.table.view}
                >
                  <Eye className="size-4" aria-hidden />
                </Link>
              </AdminTableCell>
            </tr>
          );
        })}
      </tbody>
    </AdminTable>
  );
}
