import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AdminUserToggleForm } from "@/components/admin/admin-user-toggle-form";
import { Card, CardContent } from "@/components/ui/card";
import { getPlatformUserById } from "@/lib/admin-dashboard-data";
import { getRoleLabels, getTechnicianTypeLabels } from "@/lib/i18n/labels";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import { getServerI18n } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { t, locale } = await getServerI18n();
  const p = t.dashboard.admin.usersPage;
  const { id } = await params;
  const user = await getPlatformUserById(id);

  if (!user) notFound();

  const roleLabels = getRoleLabels(t);
  const technicianTypeLabels = getTechnicianTypeLabels(t);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowRight className="size-4 rotate-180" aria-hidden />
          {p.backToList}
        </Link>
        <h1 className="text-2xl font-bold">{p.editUser}</h1>
        <p className="text-muted">{getProfileDisplayName(user, locale)}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <AdminUserToggleForm
            user={user}
            roleLabels={roleLabels}
            technicianTypeLabels={technicianTypeLabels}
          />
        </CardContent>
      </Card>
    </div>
  );
}
