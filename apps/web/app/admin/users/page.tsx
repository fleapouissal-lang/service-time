import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminUsersWorkspace } from "@/components/admin/admin-users-workspace";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  getPlatformUsers,
  getUserRoleStats,
} from "@/lib/admin-dashboard-data";
import {
  getActiveFilterOptionsForDashboard,
  getRoleFilterOptionsForDashboard,
  getUserSearchPlaceholderForDashboard,
} from "@/lib/dashboard-filter-options";
import { getRoleLabels, getTechnicianTypeLabels } from "@/lib/i18n/labels";
import { getServerI18n } from "@/lib/i18n/server";
import { filterProfiles, parseListFilters } from "@/lib/list-filters";
import { Shield, Users, Wrench } from "lucide-react";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.usersPage;
  const params = parseListFilters(await searchParams);

  const [stats, allUsers] = await Promise.all([
    getUserRoleStats(),
    getPlatformUsers("all"),
  ]);
  const users = filterProfiles(allUsers, params);
  const roleLabels = getRoleLabels(t);
  const technicianTypeLabels = getTechnicianTypeLabels(t);

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={t.meta.adminUsers}>
        <p className="text-muted">{p.subtitle}</p>
      </DashboardPageHeader>

      <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4">
        <StatCard
          label={t.dashboard.admin.users.total}
          value={stats.total}
          icon={Users}
        />
        <StatCard
          label={t.dashboard.admin.clients}
          value={stats.clients}
          hint={`${stats.activeClients} ${t.dashboard.common.activeHint}`}
          icon={Users}
          accent
        />
        <StatCard
          label={t.dashboard.admin.technicians}
          value={stats.technicians}
          hint={`${stats.activeTechnicians} ${t.dashboard.common.activeHint}`}
          icon={Wrench}
          accent
        />
        <StatCard
          label={t.dashboard.admin.admins}
          value={stats.admins}
          hint={`${stats.activeAdmins} ${t.dashboard.common.activeHint}`}
          icon={Shield}
          accent
        />
      </div>

      <AdminUsersWorkspace
        users={users}
        roleLabels={roleLabels}
        technicianTypeLabels={technicianTypeLabels}
        emptyMessage={t.dashboard.admin.users.noUsers}
        emptyFilteredMessage={t.dashboard.admin.users.emptyFiltered}
        totalCount={allUsers.length}
        filters={
          <DashboardFilterBar
            pathname="/admin/users"
            values={params}
            searchPlaceholder={getUserSearchPlaceholderForDashboard(t)}
            selects={[
              {
                name: "role",
                label: t.dashboard.admin.users.accountType,
                options: getRoleFilterOptionsForDashboard(t),
              },
              {
                name: "active",
                label: t.common.status,
                options: getActiveFilterOptionsForDashboard(t),
              },
            ]}
            resultCount={users.length}
            totalCount={allUsers.length}
          />
        }
      />
    </div>
  );
}
