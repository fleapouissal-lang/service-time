import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminLegalPagesManager } from "@/components/admin/admin-legal-pages-manager";
import { getAdminLegalPages } from "@/lib/legal-pages-admin";
import { getServerI18n } from "@/lib/i18n/server";
import { requireProfileOrThrow } from "@/lib/auth";

export default async function AdminLegalPagesPage() {
  await requireProfileOrThrow(["admin"]);
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.legalPagesPage;
  const pages = await getAdminLegalPages();

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={p.title} />
      <AdminLegalPagesManager pages={pages} />
    </div>
  );
}
