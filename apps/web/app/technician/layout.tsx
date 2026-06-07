import { redirect } from "next/navigation";
import { TechnicianDashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireProfile } from "@/lib/auth";

export default async function TechnicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile(["technician"]);
  if (!profile) redirect("/login?next=/technician");

  return (
    <TechnicianDashboardShell profile={profile}>
      {children}
    </TechnicianDashboardShell>
  );
}
