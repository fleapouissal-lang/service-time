import { redirect } from "next/navigation";
import { ClientDashboardWithLocale } from "@/components/dashboard/dashboard-with-locale";
import { requireProfile } from "@/lib/auth";
import { getServerI18n } from "@/lib/i18n/server";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = await getServerI18n();
  const profile = await requireProfile(["client"]);
  if (!profile) redirect("/login?next=/client");

  return (
    <ClientDashboardWithLocale locale={locale} profile={profile}>
      {children}
    </ClientDashboardWithLocale>
  );
}
