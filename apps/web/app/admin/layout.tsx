import { redirect } from "next/navigation";
import { AdminDashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireProfile } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile(["admin"]);
  if (!profile) redirect("/login?next=/admin");

  return (
    <AdminDashboardShell profile={profile}>
      {children}
    </AdminDashboardShell>
  );
}
