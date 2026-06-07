import { redirect } from "next/navigation";
import { ClientDashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireProfile } from "@/lib/auth";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile(["client"]);
  if (!profile) redirect("/login?next=/client");

  return (
    <ClientDashboardShell profile={profile}>
      {children}
    </ClientDashboardShell>
  );
}
