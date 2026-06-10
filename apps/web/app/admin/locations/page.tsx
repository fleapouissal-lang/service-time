import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminWorkshopsManager } from "@/components/admin/admin-workshops-manager";
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
  const workshops = await getWorkshopBranchesAdmin();

  return (
    <div className="space-y-6">
      <DashboardPageHeader title={p.title}>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
          {p.subtitle}
        </p>
      </DashboardPageHeader>

      <AdminWorkshopsManager workshops={workshops} />
    </div>
  );
}
