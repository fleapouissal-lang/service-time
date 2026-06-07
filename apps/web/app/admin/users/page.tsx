import { CreatePlatformUserForm } from "@/components/admin/create-platform-user-form";
import { PlatformUsersList } from "@/components/admin/platform-users-list";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPlatformUsers,
  getUserRoleStats,
} from "@/lib/admin-dashboard-data";
import { filterProfiles, parseListFilters } from "@/lib/list-filters";
import { Shield, Users, Wrench } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "client", label: "عميل" },
  { value: "technician", label: "فني" },
  { value: "admin", label: "مدير" },
];

const ACTIVE_OPTIONS = [
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
];

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = parseListFilters(await searchParams);

  const [stats, allUsers] = await Promise.all([
    getUserRoleStats(),
    getPlatformUsers("all"),
  ]);
  const users = filterProfiles(allUsers, params);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">المستخدمون</h1>
        <p className="mt-2 text-sm text-muted">
          إنشاء وإدارة حسابات العملاء والفنيين والمديرين من قاعدة البيانات.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="إجمالي المستخدمين"
          value={stats.total}
          icon={Users}
        />
        <StatCard
          label="عملاء"
          value={stats.clients}
          hint={`${stats.activeClients} نشط`}
          icon={Users}
          accent
        />
        <StatCard
          label="فنيون"
          value={stats.technicians}
          hint={`${stats.activeTechnicians} نشط`}
          icon={Wrench}
          accent
        />
        <StatCard
          label="مديرون"
          value={stats.admins}
          hint={`${stats.activeAdmins} نشط`}
          icon={Shield}
          accent
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">إنشاء حساب جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <CreatePlatformUserForm />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">قائمة المستخدمين</h2>

        <DashboardFilterBar
          pathname="/admin/users"
          values={params}
          searchPlaceholder="الاسم، رقم الجوال..."
          selects={[
            { name: "role", label: "نوع الحساب", options: ROLE_OPTIONS },
            { name: "active", label: "الحالة", options: ACTIVE_OPTIONS },
          ]}
          resultCount={users.length}
          totalCount={allUsers.length}
        />

        <PlatformUsersList users={users} />
      </div>
    </div>
  );
}
