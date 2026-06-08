"use client";

import type { Profile } from "@service-time/types";
import { AdminTable, AdminTableCell, AdminTableHead, AdminTableHeadCell } from "@/components/admin/admin-table";
import { AdminTableActions } from "@/components/admin/admin-table-actions";
import { DashboardTablePagination } from "@/components/dashboard/dashboard-table-pagination";
import { Badge } from "@/components/ui/badge";
import { useDashboardTablePagination } from "@/hooks/use-dashboard-table-pagination";
import { useLocale } from "@/lib/i18n/locale-context";
import type { ProfileRole, TechnicianType } from "@service-time/types";

type AdminUsersTableProps = {
  users: Profile[];
  roleLabels: Record<ProfileRole, string>;
  technicianTypeLabels: Record<TechnicianType, string>;
};

export function AdminUsersTable({
  users,
  roleLabels,
  technicianTypeLabels,
}: AdminUsersTableProps) {
  const { messages: t } = useLocale();
  const p = t.dashboard.admin.usersPage;
  const {
    pageItems,
    setPage,
    page,
    totalPages,
    totalItems,
    from,
    to,
  } = useDashboardTablePagination(users);

  return (
    <>
      <AdminTable>
        <AdminTableHead>
          <AdminTableHeadCell>{p.table.user}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[8rem]">
            {p.table.phone}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center">{p.table.role}</AdminTableHeadCell>
          <AdminTableHeadCell align="center">{t.common.status}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="w-28">
            {p.table.actions}
          </AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {pageItems.map((user) => {
            const detailHref = `/admin/users/${user.id}`;

            return (
              <tr key={user.id} className="border-b border-border">
                <AdminTableCell>
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="size-10 shrink-0 rounded-full object-cover ring-2 ring-primary/20"
                      />
                    ) : (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {user.full_name.slice(0, 1)}
                      </span>
                    )}
                    <span className="font-semibold leading-snug">{user.full_name}</span>
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
