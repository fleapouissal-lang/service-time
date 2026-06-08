"use client";

import Link from "next/link";
import { Eye, MapPin } from "lucide-react";
import type {
  ExecutionMethod,
  ServiceRequest,
  ServiceRequestStatus,
  ServiceType,
} from "@service-time/types";
import {
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeadCell,
} from "@/components/admin/admin-table";
import { Badge } from "@/components/ui/badge";
import { getIntlLocale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type ClientOrdersTableProps = {
  orders: ServiceRequest[];
  statusLabels: Record<ServiceRequestStatus, string>;
  serviceTypeLabels: Record<ServiceType, string>;
  executionMethodLabels: Record<ExecutionMethod, string>;
};

const actionBtnClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-primary/5 hover:text-primary";

export function ClientOrdersTable({
  orders,
  statusLabels,
  serviceTypeLabels,
  executionMethodLabels,
}: ClientOrdersTableProps) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.client.ordersPage;
  const intlLocale = getIntlLocale(locale);

  return (
    <AdminTable className="min-w-[880px]">
      <AdminTableHead>
        <AdminTableHeadCell>{p.table.service}</AdminTableHeadCell>
        <AdminTableHeadCell>{p.table.execution}</AdminTableHeadCell>
        <AdminTableHeadCell className="min-w-[9rem]">{p.table.location}</AdminTableHeadCell>
        <AdminTableHeadCell align="center">{t.common.status}</AdminTableHeadCell>
        <AdminTableHeadCell align="center" className="min-w-[7rem]">
          {p.table.tracking}
        </AdminTableHeadCell>
        <AdminTableHeadCell align="center" className="min-w-[9rem]">
          {p.table.date}
        </AdminTableHeadCell>
        <AdminTableHeadCell align="center" className="w-28">
          {p.table.actions}
        </AdminTableHeadCell>
      </AdminTableHead>
      <tbody>
        {orders.map((order) => {
          const detailHref = `/client/orders/${order.id}`;
          const trackHref = `/client/track/${order.tracking_token}`;

          return (
            <tr key={order.id} className="border-b border-border">
              <AdminTableCell>
                <span className="block font-semibold leading-snug">
                  {serviceTypeLabels[order.service_type]}
                </span>
              </AdminTableCell>
              <AdminTableCell className="text-muted">
                {executionMethodLabels[order.execution_method]}
              </AdminTableCell>
              <AdminTableCell className="min-w-[9rem] max-w-[14rem]">
                <span className="line-clamp-2 text-muted">
                  {order.location_text ?? t.common.dash}
                </span>
              </AdminTableCell>
              <AdminTableCell align="center">
                <Badge variant="secondary" className="whitespace-nowrap">
                  {statusLabels[order.status as ServiceRequestStatus]}
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
              <AdminTableCell align="center" className="w-28">
                <div className="flex items-center justify-center gap-1.5">
                  <Link
                    href={detailHref}
                    className={actionBtnClass}
                    title={p.table.view}
                    aria-label={p.table.view}
                  >
                    <Eye className="size-4" aria-hidden />
                  </Link>
                  <Link
                    href={trackHref}
                    className={cn(actionBtnClass)}
                    title={p.table.track}
                    aria-label={p.table.track}
                  >
                    <MapPin className="size-4" aria-hidden />
                  </Link>
                </div>
              </AdminTableCell>
            </tr>
          );
        })}
      </tbody>
    </AdminTable>
  );
}
