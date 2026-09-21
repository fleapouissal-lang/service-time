import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminBannersManager } from "@/components/admin/admin-banners-manager";
import { getAdminHeroBanners } from "@/lib/hero-banners";
import { getServerI18n } from "@/lib/i18n/server";
import { requireProfileOrThrow } from "@/lib/auth";

export default async function AdminBannersPage() {
  await requireProfileOrThrow(["admin"]);
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.bannersPage;
  const banners = await getAdminHeroBanners();

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={p.title} />
      <AdminBannersManager banners={banners} />
    </div>
  );
}
