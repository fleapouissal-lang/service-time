import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminFooterManager } from "@/components/admin/admin-footer-manager";
import { getAdminFooterContent } from "@/lib/footer-content-admin";
import { getServerI18n } from "@/lib/i18n/server";
import { requireProfileOrThrow } from "@/lib/auth";

export default async function AdminFooterPage() {
  await requireProfileOrThrow(["admin"]);
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.footerPage;
  const content = await getAdminFooterContent();

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={p.title} />
      <AdminFooterManager content={content} />
    </div>
  );
}
