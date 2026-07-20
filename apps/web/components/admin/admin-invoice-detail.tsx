"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { CheckCircle2, ExternalLink } from "lucide-react";
import {
  unvalidateInvoiceAction,
  updateInvoiceAction,
  validateInvoiceAction,
} from "@/lib/invoice-actions";
import type { InvoiceWithClient } from "@/lib/invoices-queries";
import type { InvoiceLineItem } from "@/lib/invoice-line-items";
import { InvoiceDocument } from "@/components/invoices/invoice-document";
import { InvoicePrintButton } from "@/components/invoices/invoice-print-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildInvoiceDocumentLabels } from "@/lib/invoice-document-labels";
import { getIntlLocale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/locale-context";
import type { InvoiceSourceType, InvoiceStatus } from "@service-time/types";

type AdminInvoiceDetailProps = {
  invoice: InvoiceWithClient;
  statusLabels: Record<InvoiceStatus, string>;
  sourceTypeLabels: Record<InvoiceSourceType, string>;
  lineItems: InvoiceLineItem[];
};

function MetaRow({
  label,
  value,
  ltr,
}: {
  label: string;
  value: ReactNode;
  ltr?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(7rem,10rem)_1fr] gap-x-3 border-b border-border/60 py-2.5 text-sm last:border-b-0">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 font-medium" dir={ltr ? "ltr" : undefined}>
        {value}
      </dd>
    </div>
  );
}

export function AdminInvoiceDetail({
  invoice,
  statusLabels,
  sourceTypeLabels,
  lineItems,
}: AdminInvoiceDetailProps) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.admin.invoicesPage;
  const intlLocale = getIntlLocale(locale);
  const [updateState, updateAction, updatePending] = useActionState(
    updateInvoiceAction,
    {},
  );
  const [validateState, validateAction, validatePending] = useActionState(
    validateInvoiceAction,
    {},
  );
  const [hideState, hideAction, hidePending] = useActionState(
    unvalidateInvoiceAction,
    {},
  );

  const sourceLabel = sourceTypeLabels[invoice.source_type];
  const documentLabels = buildInvoiceDocumentLabels(t, "admin");

  const orderHref =
    invoice.source_type === "service_request" && invoice.service_request_id
      ? `/admin/orders/${invoice.service_request_id}`
      : invoice.spare_part_order_id
        ? `/admin/spare-part-orders/${invoice.spare_part_order_id}`
        : null;

  const anySuccess =
    updateState.success || validateState.success || hideState.success;
  const anyError = updateState.error || validateState.error || hideState.error;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                invoice.status === "validated" ? "default" : "secondary"
              }
            >
              {statusLabels[invoice.status]}
            </Badge>
            <span className="font-mono text-sm text-muted" dir="ltr">
              {invoice.invoice_number}
            </span>
          </div>
          <p className="max-w-xl text-sm text-muted">
            {invoice.status === "validated"
              ? p.detail.visibleToClient
              : p.detail.hiddenFromClient}
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

      <div className="overflow-x-auto rounded-xl bg-neutral-100/80 p-4 sm:p-6">
        <InvoiceDocument
          invoice={invoice}
          locale={locale}
          labels={documentLabels}
          lineItems={lineItems}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 border-b border-border pb-4">
            <h3 className="text-lg font-semibold">{p.edit.title}</h3>
            <p className="mt-1 text-sm text-muted">{p.edit.hint}</p>
          </div>

          <form action={updateAction} className="space-y-5">
            <input type="hidden" name="id" value={invoice.id} />

            <p className="text-sm font-semibold text-foreground">
              {p.edit.clientSection}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="customer_name">{p.edit.customerName}</Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  defaultValue={invoice.customer_name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer_phone">{p.edit.customerPhone}</Label>
                <Input
                  id="customer_phone"
                  name="customer_phone"
                  defaultValue={invoice.customer_phone ?? ""}
                  dir="ltr"
                  placeholder={t.common.placeholderPhone}
                />
              </div>
              <div>
                <Label htmlFor="customer_company_name">
                  {p.edit.companyName}
                </Label>
                <Input
                  id="customer_company_name"
                  name="customer_company_name"
                  defaultValue={invoice.customer_company_name ?? ""}
                  placeholder={p.edit.companyNamePlaceholder}
                />
              </div>
              <div>
                <Label htmlFor="customer_ice">{p.edit.ice}</Label>
                <Input
                  id="customer_ice"
                  name="customer_ice"
                  defaultValue={invoice.customer_ice ?? ""}
                  dir="ltr"
                  placeholder={p.edit.icePlaceholder}
                />
              </div>
              <div>
                <Label htmlFor="customer_email">{p.edit.customerEmail}</Label>
                <Input
                  id="customer_email"
                  name="customer_email"
                  type="email"
                  defaultValue={invoice.customer_email ?? ""}
                  dir="ltr"
                  placeholder={t.common.placeholderEmail}
                />
              </div>
              <div>
                <Label htmlFor="customer_address">
                  {p.edit.customerAddress}
                </Label>
                <Input
                  id="customer_address"
                  name="customer_address"
                  defaultValue={invoice.customer_address ?? ""}
                  placeholder={p.edit.addressPlaceholder}
                />
              </div>
            </div>

            <p className="pt-2 text-sm font-semibold text-foreground">
              {p.edit.amountSection}
            </p>

            <div className="max-w-xs">
              <Label htmlFor="amount">{p.edit.amount}</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={Number(invoice.amount) || 0}
                dir="ltr"
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">{p.edit.notes}</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={invoice.notes ?? ""}
                rows={4}
                placeholder={p.edit.notesPlaceholder}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button type="submit" disabled={updatePending}>
                {updatePending ? t.common.saving : p.edit.save}
              </Button>
              {updateState.success ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  <CheckCircle2 className="size-4" aria-hidden />
                  {p.saveSuccess}
                </span>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 border-b border-border pb-4">
            <h3 className="text-lg font-semibold">{p.detail.manageTitle}</h3>
            <p className="mt-1 text-sm text-muted">{p.detail.manageHint}</p>
          </div>

          <dl>
            <MetaRow
              label={p.detail.invoiceNumber}
              value={invoice.invoice_number}
              ltr
            />
            <MetaRow label={p.detail.source} value={sourceLabel} />
            <MetaRow
              label={p.detail.createdAt}
              value={new Date(invoice.created_at).toLocaleString(intlLocale, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            />
            {invoice.validated_at ? (
              <MetaRow
                label={p.detail.validatedAt}
                value={new Date(invoice.validated_at).toLocaleString(
                  intlLocale,
                  {
                    dateStyle: "medium",
                    timeStyle: "short",
                  },
                )}
              />
            ) : null}
          </dl>

          {orderHref ? (
            <Link
              href={orderHref}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <ExternalLink className="size-4" aria-hidden />
              {p.detail.openOrder}
            </Link>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
            {invoice.status === "pending" ? (
              <form action={validateAction}>
                <input type="hidden" name="id" value={invoice.id} />
                <Button type="submit" disabled={validatePending}>
                  {validatePending ? t.common.saving : p.detail.validate}
                </Button>
              </form>
            ) : (
              <form action={hideAction}>
                <input type="hidden" name="id" value={invoice.id} />
                <Button type="submit" variant="outline" disabled={hidePending}>
                  {hidePending ? t.common.saving : p.detail.hideFromClient}
                </Button>
              </form>
            )}
          </div>
        </section>
      </div>

      {anySuccess && !updateState.success ? (
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          {p.saveSuccess}
        </p>
      ) : null}
      {anyError ? (
        <p className="text-sm text-destructive">{anyError}</p>
      ) : null}
    </div>
  );
}
