import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminServiceEditForm } from "@/components/admin/admin-service-edit-form";
import { Card, CardContent } from "@/components/ui/card";
import { getServiceById } from "@/lib/dashboard-queries";
import { getServerI18n } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminServiceDetailPage({ params }: PageProps) {
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.servicesPage;
  const { id } = await params;
  const service = await getServiceById(id);

  if (!service) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/services"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowRight className="size-4 rotate-180" aria-hidden />
          {p.backToList}
        </Link>
        <DashboardPageHeader title={p.editService}>
          <p className="text-muted">{service.name_ar}</p>
        </DashboardPageHeader>
      </div>

      <Card>
        <CardContent className="p-6">
          <AdminServiceEditForm service={service} />
        </CardContent>
      </Card>
    </div>
  );
}
