import { notFound } from "next/navigation";
import { ClientInvoiceDetail } from "@/components/client/client-invoice-detail";
import { requireProfile } from "@/lib/auth";
import { getInvoiceLineItems } from "@/lib/invoice-line-items";
import { getClientValidatedInvoice } from "@/lib/invoices-queries";
import { getServiceTypeLabels } from "@/lib/i18n/labels";
import { getServerI18n } from "@/lib/i18n/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientInvoiceDetailPage({ params }: PageProps) {
  const profile = await requireProfile(["client"]);
  if (!profile) return null;

  const { id } = await params;
  const invoice = await getClientValidatedInvoice(profile.id, id);
  if (!invoice) notFound();

  const { t } = await getServerI18n();
  const p = t.dashboard.client.invoicesPage;
  const lineItems = await getInvoiceLineItems(
    invoice,
    p.document.serviceLine,
    p.document.productFallback,
    p.document.deliveryLine,
    {
      serviceTypeLabels: getServiceTypeLabels(t),
      catalogCategories: t.services.catalog.categories,
    },
  );

  return <ClientInvoiceDetail invoice={invoice} lineItems={lineItems} />;
}
