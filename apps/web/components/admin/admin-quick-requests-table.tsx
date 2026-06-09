"use client";

import Link from "next/link";
import type { QuickRequestRow } from "@/lib/quick-requests-queries";
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
import { formatDateTime } from "@/lib/format-datetime";
import { useLocale } from "@/lib/i18n/locale-context";

type AdminQuickRequestsTableProps = {
  requests: QuickRequestRow[];
};

function truncate(text: string, max = 80): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export function AdminQuickRequestsTable({
  requests,
}: AdminQuickRequestsTableProps) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.admin.quickRequestsPage;
  const {
    pageItems,
    setPage,
    page,
    totalPages,
    totalItems,
    from,
    to,
  } = useDashboardTablePagination(requests);

  return (
    <>
      <AdminTable className="min-w-[960px]">
        <AdminTableHead>
          <AdminTableHeadCell className="min-w-[11rem]">
            {p.table.contact}
          </AdminTableHeadCell>
          <AdminTableHeadCell>{p.table.message}</AdminTableHeadCell>
          <AdminTableHeadCell align="center">{p.table.photo}</AdminTableHeadCell>
          <AdminTableHeadCell align="center">{p.table.account}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[9rem]">
            {p.table.date}
          </AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {pageItems.map((row) => (
            <tr key={row.id} className="border-b border-border">
              <AdminTableCell>
                <AdminTableCustomerInfo
                  name={row.name}
                  phone={row.phone}
                  extra={row.email}
                />
              </AdminTableCell>
              <AdminTableCell>
                <p className="max-w-md text-sm leading-relaxed" title={row.message}>
                  {truncate(row.message)}
                </p>
              </AdminTableCell>
              <AdminTableCell align="center">
                {row.photo_storage_path ? (
                  <Badge variant="secondary">{t.common.yes}</Badge>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </AdminTableCell>
              <AdminTableCell align="center">
                {row.client_id ? (
                  <Link
                    href={`/admin/users/${row.client_id}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {p.table.viewClient}
                  </Link>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </AdminTableCell>
              <AdminTableCell align="center" ltr>
                <span className="text-sm tabular-nums text-muted">
                  {formatDateTime(row.created_at, locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
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
