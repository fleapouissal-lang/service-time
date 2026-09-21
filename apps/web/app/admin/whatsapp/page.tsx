import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminWhatsAppFloatForm } from "@/components/admin/admin-whatsapp-float-form";
import { getAdminWhatsAppFloatSettings } from "@/lib/whatsapp-float-admin";
import { getServerI18n } from "@/lib/i18n/server";
import { requireProfileOrThrow } from "@/lib/auth";

export default async function AdminWhatsAppFloatPage() {
  await requireProfileOrThrow(["admin"]);
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.whatsappFloatPage;
  const settings = await getAdminWhatsAppFloatSettings();

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={p.title} />
      <AdminWhatsAppFloatForm settings={settings} />
    </div>
  );
}
