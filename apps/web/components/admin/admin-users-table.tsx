"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Profile } from "@service-time/types";
import type { ProfileRole, TechnicianType } from "@service-time/types";
import { deletePlatformUserAction } from "@/app/admin/actions";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import {
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeadCell,
} from "@/components/admin/admin-table";
import { AdminTableActions } from "@/components/admin/admin-table-actions";
import { DashboardTablePagination } from "@/components/dashboard/dashboard-table-pagination";
import { Badge } from "@/components/ui/badge";
import { useDashboardTablePagination } from "@/hooks/use-dashboard-table-pagination";
import { useLocale } from "@/lib/i18n/locale-context";
import { getProfileDisplayName } from "@/lib/profile-display-name";

type AdminUsersTableProps = {
  users: Profile[];
  roleLabels: Record<ProfileRole, string>;
  technicianTypeLabels: Record<TechnicianType, string>;
  onEditUser?: (user: Profile) => void;
};

export function AdminUsersTable({
  users,
  roleLabels,
  technicianTypeLabels,
  onEditUser,
}: AdminUsersTableProps) {
  const router = useRouter();
  const { messages: t, locale } = useLocale();
  const p = t.dashboard.admin.usersPage;
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [pending, startTransition] = useTransition();
  const {
    pageItems,
    setPage,
    page,
    totalPages,
    totalItems,
    from,
    to,
  } = useDashboardTablePagination(users);

  const handleDelete = () => {
    if (!deleteTarget) return;

    const formData = new FormData();
    formData.set("id", deleteTarget.id);

    startTransition(async () => {
      setDeleteError("");
      try {
        await deletePlatformUserAction(formData);
        setDeleteTarget(null);
        router.refresh();
      } catch (err) {
        setDeleteError(
          err instanceof Error ? err.message : t.errors.admin.deleteFailed,
        );
      }
    });
  };

  return (
    <>
      {deleteError ? (
        <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {deleteError}
        </div>
      ) : null}

      <AdminTable>
        <AdminTableHead>
          <AdminTableHeadCell>{p.table.user}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[8rem]">
            {p.table.phone}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center">{p.table.role}</AdminTableHeadCell>
          <AdminTableHeadCell align="center">{t.common.status}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="w-36">
            {p.table.actions}
          </AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {pageItems.map((user) => {
            const detailHref = `/admin/users/${user.id}`;
            const displayName = getProfileDisplayName(user, locale);

            return (
              <tr key={user.id} className="border-b border-border">
                <AdminTableCell>
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatar_url}
                        alt={displayName}
                        className="size-10 shrink-0 rounded-full object-cover ring-2 ring-primary/20"
                      />
                    ) : (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {displayName.slice(0, 1)}
                      </span>
                    )}
                    <span className="font-semibold leading-snug">{displayName}</span>
                  </div>
                </AdminTableCell>
                <AdminTableCell ltr className="min-w-[8rem] text-muted">
                  {user.phone ?? t.common.dash}
                </AdminTableCell>
                <AdminTableCell align="center">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant="secondary">{roleLabels[user.role]}</Badge>
                    {user.role === "technician" && user.technician_type ? (
                      <Badge variant="outline" className="text-[10px]">
                        {technicianTypeLabels[user.technician_type]}
                      </Badge>
                    ) : null}
                  </div>
                </AdminTableCell>
                <AdminTableCell align="center">
                  <Badge variant={user.is_active ? "success" : "outline"}>
                    {user.is_active ? t.common.active : t.common.inactive}
                  </Badge>
                </AdminTableCell>
                <AdminTableCell align="center" className="w-36">
                  <AdminTableActions
                    viewHref={detailHref}
                    onEdit={onEditUser ? () => onEditUser(user) : undefined}
                    editHref={onEditUser ? undefined : detailHref}
                    viewLabel={p.table.view}
                    editLabel={p.table.edit}
                    deleteLabel={t.common.delete}
                    onDelete={() => {
                      setDeleteError("");
                      setDeleteTarget(user);
                    }}
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

      <AdminConfirmDialog
        open={Boolean(deleteTarget)}
        title={p.deleteConfirmTitle}
        message={
          deleteTarget
            ? p.deleteConfirmMessage.replace(
                "{name}",
                getProfileDisplayName(deleteTarget, locale),
              )
            : ""
        }
        cancelLabel={t.common.cancel}
        confirmLabel={t.common.delete}
        loadingLabel={t.common.loading}
        pending={pending}
        onCancel={() => {
          if (!pending) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}
