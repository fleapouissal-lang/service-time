import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AdminInvoiceDetail } from "@/components/admin/admin-invoice-detail";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import {
  getInvoiceSourceTypeLabels,
  getInvoiceStatusLabels,
} from "@/lib/invoice-labels";
import { getInvoiceLineItems } from "@/lib/invoice-line-items";
import { getAdminInvoiceById } from "@/lib/invoices-queries";
import { getServiceTypeLabels } from "@/lib/i18n/labels";
import { getServerI18n } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminInvoiceDetailPage({ params }: PageProps) {
  const { t } = await getServerI18n();
  const p = t.dashboard.admin.invoicesPage;
  const { id } = await params;
  const invoice = await getAdminInvoiceById(id);

  if (!invoice) notFound();

  const statusLabels = getInvoiceStatusLabels(t);
  const sourceTypeLabels = getInvoiceSourceTypeLabels(t);
  const lineItems = await getInvoiceLineItems(
    invoice,
    p.document.serviceLine,
    p.document.productFallback,
    p.document.deliveryLine,
    {
      asAdmin: true,
      serviceTypeLabels: getServiceTypeLabels(t),
      catalogCategories: t.services.catalog.categories,
    },
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/invoices"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowRight className="size-4 rotate-180" aria-hidden />
          {p.backToList}
        </Link>
        <DashboardPageHeader title={p.detailTitle}>
          <p className="text-sm text-muted">{p.detail.pageHint}</p>
        </DashboardPageHeader>
      </div>

      <AdminInvoiceDetail
        invoice={invoice}
        statusLabels={statusLabels}
        sourceTypeLabels={sourceTypeLabels}
        lineItems={lineItems}
      />
    </div>
  );
}
