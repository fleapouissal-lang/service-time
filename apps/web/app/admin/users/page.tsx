import { CreatePlatformUserForm } from "@/components/admin/create-platform-user-form";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
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
      <div>
        <h1 className="text-2xl font-bold">{t.meta.adminUsers}</h1>
        <p className="text-muted">{p.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <CreatePlatformUserForm />

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

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              {allUsers.length === 0
                ? t.dashboard.admin.users.noUsers
                : t.dashboard.admin.users.emptyFiltered}
            </p>
          ) : (
            <AdminUsersTable
              users={users}
              roleLabels={roleLabels}
              technicianTypeLabels={technicianTypeLabels}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
