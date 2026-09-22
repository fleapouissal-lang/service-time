import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminBannersManager } from "@/components/admin/admin-banners-manager";
import { AdminCtaBannersManager } from "@/components/admin/admin-cta-banners-manager";
import { getAdminCtaBanners } from "@/lib/cta-banners";
import { getAdminHeroBanners } from "@/lib/hero-banners";
import { getServerI18n } from "@/lib/i18n/server";
import { requireProfileOrThrow } from "@/lib/auth";

export default async function AdminBannersPage() {
  await requireProfileOrThrow(["admin"]);
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.bannersPage;
  const [heroBanners, ctaBanners] = await Promise.all([
    getAdminHeroBanners(),
    getAdminCtaBanners(),
  ]);

  return (
    <div className="space-y-10">
      <DashboardPageHeader title={p.title} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          {p.heroSectionTitle}
        </h2>
        <AdminBannersManager banners={heroBanners} />
      </section>

      <section className="space-y-4 border-t border-border pt-10">
        <h2 className="text-lg font-semibold tracking-tight">
          {p.ctaSectionTitle}
        </h2>
        <AdminCtaBannersManager banners={ctaBanners} />
      </section>
    </div>
  );
}
