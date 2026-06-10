"use client";

import { useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import type { QuickRequestRow } from "@/lib/quick-requests-queries";
import {
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeadCell,
} from "@/components/admin/admin-table";
import { AdminTableActions } from "@/components/admin/admin-table-actions";
import { DashboardTablePagination } from "@/components/dashboard/dashboard-table-pagination";
import { QuickRequestDetailDialog } from "@/components/quick-requests/quick-request-detail-dialog";
import { Badge } from "@/components/ui/badge";
import { useDashboardTablePagination } from "@/hooks/use-dashboard-table-pagination";
import { formatDateTime } from "@/lib/format-datetime";
import { useLocale } from "@/lib/i18n/locale-context";

type ClientQuickRequestsTableProps = {
  requests: QuickRequestRow[];
};

function truncate(text: string, max = 100): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export function ClientQuickRequestsTable({
  requests,
}: ClientQuickRequestsTableProps) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.client.quickRequestsPage;
  const [detailTarget, setDetailTarget] = useState<QuickRequestRow | null>(null);
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
      <AdminTable className="min-w-[720px]">
        <AdminTableHead>
          <AdminTableHeadCell>{p.table.message}</AdminTableHeadCell>
          <AdminTableHeadCell align="center">{p.table.photo}</AdminTableHeadCell>
          <AdminTableHeadCell align="center">{p.table.adminStatus}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[9rem]">
            {p.table.date}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="w-20">
            {p.table.actions}
          </AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {pageItems.map((row) => {
            const reviewed = Boolean(row.admin_read_at);
            return (
            <tr
              key={row.id}
              className={
                reviewed
                  ? "cursor-pointer border-b border-border transition-colors hover:bg-muted/5"
                  : "cursor-pointer border-b border-border bg-primary/5 transition-colors hover:bg-primary/10"
              }
              onClick={() => setDetailTarget(row)}
            >
              <AdminTableCell>
                <p className="text-sm leading-relaxed" title={row.message}>
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
                {row.admin_read_at ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                    {p.table.adminRead}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
                    <Clock className="size-4 shrink-0" aria-hidden />
                    {p.table.adminPending}
                  </span>
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
              <AdminTableCell
                align="center"
                className="w-20"
                onClick={(event) => event.stopPropagation()}
              >
                <AdminTableActions
                  onView={() => setDetailTarget(row)}
                  viewLabel={p.table.view}
                  editLabel={p.table.view}
                  className="justify-center"
                />
              </AdminTableCell>
            </tr>
            );
          })}
        </tbody>
      </AdminTable>

      <QuickRequestDetailDialog
        request={detailTarget}
        onClose={() => setDetailTarget(null)}
        variant="client"
      />

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
