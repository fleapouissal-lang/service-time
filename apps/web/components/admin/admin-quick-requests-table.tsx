"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { QuickRequestRow } from "@/lib/quick-requests-queries";
import {
  AdminTable,
  AdminTableCell,
  AdminTableCustomerInfo,
  AdminTableHead,
  AdminTableHeadCell,
} from "@/components/admin/admin-table";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminQuickRequestDetailDialog } from "@/components/admin/admin-quick-request-detail-dialog";
import { AdminTableActions } from "@/components/admin/admin-table-actions";
import { DashboardTablePagination } from "@/components/dashboard/dashboard-table-pagination";
import { Badge } from "@/components/ui/badge";
import { deleteQuickRequestAction, setQuickRequestAdminReadStatusAction } from "@/app/admin/actions";
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
  const router = useRouter();
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.admin.quickRequestsPage;
  const [detailTarget, setDetailTarget] = useState<QuickRequestRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuickRequestRow | null>(null);
  const [readStatusOverrides, setReadStatusOverrides] = useState<
    Record<string, boolean>
  >({});
  const [pending, startTransition] = useTransition();
  const {
    pageItems,
    setPage,
    page,
    totalPages,
    totalItems,
    from,
    to,
  } = useDashboardTablePagination(requests);

  const handleDelete = () => {
    if (!deleteTarget) return;
    const formData = new FormData();
    formData.set("id", deleteTarget.id);
    startTransition(async () => {
      await deleteQuickRequestAction(formData);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  const isRowRead = (row: QuickRequestRow) => {
    if (row.id in readStatusOverrides) {
      return readStatusOverrides[row.id];
    }
    return Boolean(row.admin_read_at);
  };

  const applyReadStatus = (
    rowId: string,
    read: boolean,
    adminReadAt: string | null,
  ) => {
    setReadStatusOverrides((current) => ({ ...current, [rowId]: read }));
    setDetailTarget((current) =>
      current?.id === rowId
        ? { ...current, admin_read_at: adminReadAt }
        : current,
    );
  };

  const handleView = (row: QuickRequestRow) => {
    setDetailTarget({
      ...row,
      admin_read_at: isRowRead(row) ? row.admin_read_at : null,
    });
  };

  const handleToggleReadStatus = (row: QuickRequestRow) => {
    const nextRead = !isRowRead(row);
    startTransition(async () => {
      const result = await setQuickRequestAdminReadStatusAction(row.id, nextRead);
      if ("ok" in result && result.ok) {
        applyReadStatus(row.id, nextRead, result.admin_read_at);
        router.refresh();
      }
    });
  };

  const handleDetailReadStatusChange = (
    read: boolean,
    adminReadAt: string | null,
  ) => {
    if (!detailTarget) return;
    applyReadStatus(detailTarget.id, read, adminReadAt);
    router.refresh();
  };

  return (
    <>
      <AdminTable className="min-w-[960px]">
        <AdminTableHead>
          <AdminTableHeadCell className="min-w-[11rem]">
            {p.table.contact}
          </AdminTableHeadCell>
          <AdminTableHeadCell>{p.table.message}</AdminTableHeadCell>
          <AdminTableHeadCell align="center">{p.table.photo}</AdminTableHeadCell>
          <AdminTableHeadCell align="center">{p.table.status}</AdminTableHeadCell>
          <AdminTableHeadCell align="center">{p.table.account}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[9rem]">
            {p.table.date}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="w-36">
            {p.table.actions}
          </AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {pageItems.map((row) => {
            const read = isRowRead(row);
            return (
            <tr
              key={row.id}
              className={
                read
                  ? "cursor-pointer border-b border-border transition-colors hover:bg-muted/5"
                  : "cursor-pointer border-b border-border bg-primary/5 transition-colors hover:bg-primary/10"
              }
              onClick={() => handleView(row)}
            >
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
                {read ? (
                  <Badge variant="success">{p.table.read}</Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 text-amber-600 dark:text-amber-400"
                  >
                    {p.table.unread}
                  </Badge>
                )}
              </AdminTableCell>
              <AdminTableCell
                align="center"
                onClick={(event) => event.stopPropagation()}
              >
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
              <AdminTableCell
                align="center"
                className="w-36"
                onClick={(event) => event.stopPropagation()}
              >
                <AdminTableActions
                  onView={() => handleView(row)}
                  viewLabel={p.table.view}
                  onToggleRead={() => handleToggleReadStatus(row)}
                  toggleReadLabel={read ? p.markUnread : p.markRead}
                  isRead={read}
                  deleteLabel={t.common.delete}
                  onDelete={() => setDeleteTarget(row)}
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

      <AdminQuickRequestDetailDialog
        request={detailTarget}
        onClose={() => setDetailTarget(null)}
        isRead={detailTarget ? isRowRead(detailTarget) : undefined}
        onReadStatusChange={handleDetailReadStatusChange}
      />

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title={p.deleteConfirmTitle}
        message={
          deleteTarget
            ? p.deleteConfirmMessage.replace("{name}", deleteTarget.name)
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
