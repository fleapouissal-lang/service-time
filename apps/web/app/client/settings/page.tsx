import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardSettingsPanel } from "@/components/settings/dashboard-settings-panel";
import { getDashboardSettingsPageData } from "@/lib/settings-page-data";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.meta.settings };
}

export default async function ClientSettingsPage() {
  const { t } = await getServerI18n();
  const data = await getDashboardSettingsPageData(["client"]);
  if (!data) redirect("/login?next=/client/settings");

  return (
    <div className="mx-auto w-[90%] max-w-[900px] space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold">{t.dashboard.settings.title}</h1>
        <p className="text-muted">{t.dashboard.settings.subtitle}</p>
      </div>
      <DashboardSettingsPanel profile={data.profile} email={data.email} />
    </div>
  );
}
