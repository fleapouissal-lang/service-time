import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AdminSparePartEditForm } from "@/components/admin/admin-spare-part-edit-form";
import { Card, CardContent } from "@/components/ui/card";
import { getSparePartById } from "@/lib/dashboard-queries";
import { getServerI18n } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminSparePartDetailPage({ params }: PageProps) {
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.sparePartsPage;
  const { id } = await params;
  const part = await getSparePartById(id);

  if (!part) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/spare-parts"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowRight className="size-4 rotate-180" aria-hidden />
          {p.backToList}
        </Link>
        <h1 className="text-2xl font-bold">{p.editPart}</h1>
        <p className="text-muted">{part.name_ar}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <AdminSparePartEditForm part={part} />
        </CardContent>
      </Card>
    </div>
  );
}
