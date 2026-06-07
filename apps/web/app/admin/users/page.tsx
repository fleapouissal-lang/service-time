import { CreatePlatformUserForm } from "@/components/admin/create-platform-user-form";
import { PlatformUsersList } from "@/components/admin/platform-users-list";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPlatformUsers,
  getUserRoleStats,
} from "@/lib/admin-dashboard-data";
import {
  getActiveFilterOptionsForDashboard,
  getRoleFilterOptionsForDashboard,
  getUserSearchPlaceholderForDashboard,
} from "@/lib/dashboard-filter-options";
import { getServerI18n } from "@/lib/i18n/server";
import { filterProfiles, parseListFilters } from "@/lib/list-filters";
import { Shield, Users, Wrench } from "lucide-react";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { t } = await getServerI18n();
  const params = parseListFilters(await searchParams);

  const [stats, allUsers] = await Promise.all([
    getUserRoleStats(),
    getPlatformUsers("all"),
  ]);
  const users = filterProfiles(allUsers, params);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t.meta.adminUsers}</h1>
        <p className="mt-2 text-sm text-muted">
          {t.dashboard.common.manageUsers}
        </p>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.dashboard.admin.users.createAccount}</CardTitle>
        </CardHeader>
        <CardContent>
          <CreatePlatformUserForm />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t.meta.adminUsers}</h2>

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

        <PlatformUsersList users={users} />
      </div>
    </div>
  );
}
