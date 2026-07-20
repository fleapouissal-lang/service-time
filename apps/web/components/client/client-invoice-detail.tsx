"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { Invoice } from "@service-time/types";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { InvoicePrintButton } from "@/components/invoices/invoice-print-button";
import { buildInvoiceDocumentLabels } from "@/lib/invoice-document-labels";
import type { InvoiceLineItem } from "@/lib/invoice-line-items";
import { useLocale } from "@/lib/i18n/locale-context";

type ClientInvoiceDetailProps = {
  invoice: Invoice;
  lineItems: InvoiceLineItem[];
};

export function ClientInvoiceDetail({
  invoice,
  lineItems,
}: ClientInvoiceDetailProps) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.client.invoicesPage;

  const documentLabels = buildInvoiceDocumentLabels(t, "client");

  const orderHref =
    invoice.source_type === "service_request" && invoice.service_request_id
      ? `/client/orders/${invoice.service_request_id}`
      : invoice.spare_part_order_id
        ? `/client/spare-part-orders/${invoice.spare_part_order_id}`
        : null;

  return (
    <div className="mx-auto w-[92%] max-w-[920px] space-y-6 pb-16">
      <div>
        <Link
          href="/client/invoices"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowRight className="size-4 rotate-180" aria-hidden />
          {p.backToList}
        </Link>
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h1 className="text-2xl font-bold">{p.detailTitle}</h1>
            <p className="mt-1 font-mono text-sm text-muted" dir="ltr">
              {invoice.invoice_number}
            </p>
          </div>
          <InvoicePrintButton
            invoice={invoice}
            locale={locale}
            labels={documentLabels}
            lineItems={lineItems}
            buttonLabel={p.document.downloadPdf}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-neutral-100/80 p-3 sm:p-5">
        <InvoiceDocument
          invoice={invoice}
          locale={locale}
          labels={documentLabels}
          lineItems={lineItems}
        />
      </div>

      {orderHref ? (
        <Link
          href={orderHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ExternalLink className="size-4" aria-hidden />
          {p.detail.openOrder}
        </Link>
      ) : null}
    </div>
  );
}
