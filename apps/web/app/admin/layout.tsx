import { redirect } from "next/navigation";
import { AdminDashboardWithLocale } from "@/components/dashboard/dashboard-with-locale";
import { requireProfile } from "@/lib/auth";
import { getServerI18n } from "@/lib/i18n/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = await getServerI18n();
  const profile = await requireProfile(["admin"]);
  if (!profile) redirect("/login?next=/admin");

  return (
    <AdminDashboardWithLocale locale={locale} profile={profile}>
      {children}
    </AdminDashboardWithLocale>
  );
}
