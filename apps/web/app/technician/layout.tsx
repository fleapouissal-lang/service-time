import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TechnicianDashboardWithLocale } from "@/components/dashboard/dashboard-with-locale";
import { requireProfile } from "@/lib/auth";
import { getServerI18n } from "@/lib/i18n/server";
import { NO_INDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = NO_INDEX_METADATA;

export default async function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = await getServerI18n();
  const profile = await requireProfile(["technician"]);
  if (!profile) redirect("/login?next=/technician");

  return (
    <TechnicianDashboardWithLocale locale={locale} profile={profile}>
      {children}
    </TechnicianDashboardWithLocale>
  );
}
