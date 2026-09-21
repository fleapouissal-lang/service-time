import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminIndustrialZonesManager } from "@/components/admin/admin-industrial-zones-manager";
import { AdminWorkshopsManager } from "@/components/admin/admin-workshops-manager";
import { getIndustrialZonesAdmin } from "@/lib/industrial-zones-admin";
import { getWorkshopBranchesAdmin } from "@/lib/workshop-locations-admin";
import { getServerI18n } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildPageMetadata({
    title: t.dashboard.admin.locationsPage.title,
    description: t.dashboard.admin.locationsPage.subtitle,
    pathname: "/admin/locations",
    locale,
    noIndex: true,
  });
}

export default async function AdminLocationsPage() {
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.locationsPage;
  const [workshops, industrialZones] = await Promise.all([
    getWorkshopBranchesAdmin(),
    getIndustrialZonesAdmin(),
  ]);

  return (
    <div className="space-y-10">
      <DashboardPageHeader title={p.title}>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
          {p.subtitle}
        </p>
      </DashboardPageHeader>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">{p.workshopsSectionTitle}</h2>
        <AdminWorkshopsManager workshops={workshops} />
      </section>

      <section className="space-y-4">
        <AdminIndustrialZonesManager zones={industrialZones} />
      </section>
    </div>
  );
}
