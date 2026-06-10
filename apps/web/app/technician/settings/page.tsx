import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardSettingsPanel } from "@/components/settings/dashboard-settings-panel";
import { getDashboardSettingsPageData } from "@/lib/settings-page-data";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.meta.settings };
}

export default async function TechnicianSettingsPage() {
  const { t } = await getServerI18n();
  const data = await getDashboardSettingsPageData(["technician"]);
  if (!data) redirect("/login?next=/technician/settings");

  return (
    <div className="mx-auto w-full max-w-[900px] space-y-6">
      <DashboardPageHeader title={t.dashboard.settings.title}>
        <p className="text-muted">{t.dashboard.settings.subtitle}</p>
      </DashboardPageHeader>
      <DashboardSettingsPanel profile={data.profile} email={data.email} />
    </div>
  );
}
