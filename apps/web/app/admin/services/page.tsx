import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import {
  AdminServiceAddForm,
  AdminServicesTable,
} from "@/components/admin/admin-services-manager";
import { Card, CardContent } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getServerI18n } from "@/lib/i18n/server";
import { getAdminServicesCatalog } from "@/lib/services-catalog-admin";
import { requireProfileOrThrow } from "@/lib/auth";

export default async function AdminServicesPage() {
  await requireProfileOrThrow(["admin"]);
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.servicesPage;
  const arMessages = getDictionary("ar");
  const enMessages = getDictionary("en");
  const categories = await getAdminServicesCatalog(
    arMessages.services.catalog,
    enMessages.services.catalog,
  );

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={p.title} />
      <p className="text-sm text-muted">{p.seedHint}</p>
      <AdminServiceAddForm />
      <Card>
        <CardContent className="p-0">
          <AdminServicesTable categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
