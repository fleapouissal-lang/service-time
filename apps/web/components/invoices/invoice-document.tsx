import Image from "next/image";
import type { Invoice } from "@service-time/types";
import type { Locale } from "@/lib/i18n/config";
import { getInvoiceLogoSrc } from "@/lib/invoice-branding";
import { formatInvoiceDate, formatInvoiceMoney } from "@/lib/invoice-format";
import type { InvoiceLineItem } from "@/lib/invoice-line-items";
import { addDaysIso, computeInvoiceTotals } from "@/lib/invoice-totals";
import { cn } from "@/lib/utils";

export type InvoiceDocumentLabels = {
  title: string;
  brand: string;
  company: string;
  email: string;
  website: string;
  location: string;
  phoneCompany: string;
  taxIdLabel: string;
  taxIdValue: string;
  regIdLabel: string;
  regIdValue: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  client: string;
  phone: string;
  companyName: string;
  ice: string;
  clientEmail: string;
  clientAddress: string;
  designation: string;
  serviceLine: string;
  productFallback: string;
  deliveryLine: string;
  qty: string;
  unitHt: string;
  totalHtCol: string;
  totalHt: string;
  vat: string;
  totalTtc: string;
  bankDetails: string;
  bankInfo: string;
  thankYou: string;
  page: string;
  notes: string;
};

type InvoiceDocumentProps = {
  invoice: Invoice;
  locale: Locale;
  labels: InvoiceDocumentLabels;
  lineItems: InvoiceLineItem[];
  className?: string;
};

export function InvoiceDocument({
  invoice,
  locale,
  labels,
  lineItems,
  className,
}: InvoiceDocumentProps) {
  const issuedAt = new Date(invoice.validated_at ?? invoice.created_at);
  const dueAt = addDaysIso(issuedAt, 14);
  const totals = computeInvoiceTotals(Number(invoice.amount) || 0);
  const logoSrc = getInvoiceLogoSrc(locale);
  const money = (value: number) => formatInvoiceMoney(value, locale);
  const vatPercent = Math.round(totals.vatRate * 100);
  const isAr = locale === "ar";
  const textDir = isAr ? "rtl" : "ltr";
  const partyAlign = isAr ? "text-right" : "text-left";
  const partyRowClass = isAr
    ? "flex flex-wrap items-baseline justify-start gap-x-2 gap-y-0.5"
    : "grid grid-cols-[7.5rem_1fr] items-baseline gap-x-3";

  return (
    <article
      id="invoice-document"
      dir="ltr"
      className={cn(
        "invoice-a4 mx-auto w-full max-w-[210mm] bg-white text-neutral-900 shadow-sm ring-1 ring-neutral-200",
        "min-h-[297mm] print:max-w-none print:min-h-0 print:shadow-none print:ring-0",
        className,
      )}
    >
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          #invoice-document {
            width: 100% !important;
            max-width: none !important;
            min-height: auto !important;
            box-shadow: none !important;
          }
          #invoice-document .invoice-sheet {
            padding: 0 !important;
          }
          #invoice-document thead {
            display: table-header-group;
          }
          #invoice-document tfoot {
            display: table-footer-group;
          }
          #invoice-document tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          #invoice-document .invoice-totals {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          #invoice-document .invoice-parties {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="invoice-sheet px-8 py-8 sm:px-10 sm:py-10">
        {/* Top bar: logo left | title + dates right */}
        <header className="flex items-start justify-between gap-8 border-b border-neutral-200 pb-6">
          <Image
            src={logoSrc}
            alt={labels.brand}
            width={220}
            height={80}
            unoptimized
            className="h-16 w-auto object-contain sm:h-[4.5rem]"
            priority
          />
          <div className="text-right">
            <h2
              className="text-4xl font-black tracking-tight text-neutral-900"
              dir={textDir}
            >
              {labels.title}
            </h2>
            <p
              className="mt-2 font-mono text-[15px] font-semibold text-neutral-700"
              dir="ltr"
            >
              {invoice.invoice_number}
            </p>
            <div className="mt-4 space-y-1.5 text-[13px]">
              <div className="flex items-center justify-end gap-3">
                <span className="font-semibold text-neutral-500" dir={textDir}>
                  {labels.date}
                </span>
                <span className="min-w-[5.5rem] font-medium tabular-nums" dir="ltr">
                  {formatInvoiceDate(issuedAt)}
                </span>
              </div>
              <div className="flex items-center justify-end gap-3">
                <span className="font-semibold text-neutral-500" dir={textDir}>
                  {labels.dueDate}
                </span>
                <span className="min-w-[5.5rem] font-medium tabular-nums" dir="ltr">
                  {formatInvoiceDate(dueAt)}
                </span>
              </div>
            </div>
          </div>
        </header>

        <section
          className="invoice-parties mt-8 grid gap-4 sm:grid-cols-2"
          dir={textDir}
        >
          <div className={cn("border-e border-neutral-200 pe-5", partyAlign)}>
            <p className="text-[15px] font-bold text-neutral-900">
              {labels.brand}
            </p>
            <p className="mt-1 text-[13px] text-neutral-600">{labels.location}</p>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div className={partyRowClass}>
                <dt className="text-neutral-500">{labels.clientEmail}</dt>
                <dd
                  className="min-w-0 break-all font-medium text-neutral-800"
                  dir="ltr"
                >
                  {labels.email}
                </dd>
              </div>
              <div className={partyRowClass}>
                <dt className="text-neutral-500">Web</dt>
                <dd
                  className="min-w-0 break-all font-medium text-neutral-800"
                  dir="ltr"
                >
                  {labels.website}
                </dd>
              </div>
              <div className={partyRowClass}>
                <dt className="text-neutral-500">{labels.phone}</dt>
                <dd className="min-w-0 font-medium text-neutral-800" dir="ltr">
                  {labels.phoneCompany}
                </dd>
              </div>
              <div className={partyRowClass}>
                <dt className="text-neutral-500">{labels.taxIdLabel}</dt>
                <dd className="min-w-0 font-medium text-neutral-800" dir="ltr">
                  {labels.taxIdValue}
                </dd>
              </div>
              <div className={partyRowClass}>
                <dt className="text-neutral-500">{labels.regIdLabel}</dt>
                <dd className="min-w-0 font-medium text-neutral-800" dir="ltr">
                  {labels.regIdValue}
                </dd>
              </div>
            </dl>
          </div>

          <div className={cn("ps-1 sm:ps-5", partyAlign)}>
            <p className="text-[15px] font-bold text-neutral-900">
              {invoice.customer_name}
            </p>
            <dl className="mt-3 space-y-2 text-[13px]">
              {invoice.customer_company_name ? (
                <div className={partyRowClass}>
                  <dt className="text-neutral-500">{labels.companyName}</dt>
                  <dd className="min-w-0 font-medium text-neutral-800">
                    {invoice.customer_company_name}
                  </dd>
                </div>
              ) : null}
              {invoice.customer_ice ? (
                <div className={partyRowClass}>
                  <dt className="text-neutral-500">{labels.ice}</dt>
                  <dd className="min-w-0 font-medium text-neutral-800" dir="ltr">
                    {invoice.customer_ice}
                  </dd>
                </div>
              ) : null}
              {invoice.customer_phone ? (
                <div className={partyRowClass}>
                  <dt className="text-neutral-500">{labels.phone}</dt>
                  <dd className="min-w-0 font-medium text-neutral-800" dir="ltr">
                    {invoice.customer_phone}
                  </dd>
                </div>
              ) : null}
              {invoice.customer_email ? (
                <div className={partyRowClass}>
                  <dt className="text-neutral-500">{labels.clientEmail}</dt>
                  <dd
                    className="min-w-0 break-all font-medium text-neutral-800"
                    dir="ltr"
                  >
                    {invoice.customer_email}
                  </dd>
                </div>
              ) : null}
              {invoice.customer_address ? (
                <div className={partyRowClass}>
                  <dt className="text-neutral-500">{labels.clientAddress}</dt>
                  <dd className="min-w-0 font-medium text-neutral-800">
                    {invoice.customer_address}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </section>

        <section className="mt-8 text-[13px]" dir={textDir}>
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col />
              <col className="w-14" />
              <col className="w-28" />
              <col className="w-28" />
            </colgroup>
            <thead>
              <tr className="border-y border-neutral-900">
                <th className="py-2.5 pe-2 text-start text-[11px] font-bold uppercase tracking-wide">
                  {labels.designation}
                </th>
                <th className="py-2.5 text-center text-[11px] font-bold uppercase tracking-wide">
                  {labels.qty}
                </th>
                <th className="py-2.5 text-center text-[11px] font-bold uppercase tracking-wide">
                  {labels.unitHt}
                </th>
                <th className="py-2.5 text-center text-[11px] font-bold uppercase tracking-wide">
                  {labels.totalHtCol}
                </th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((line, index) => (
                <tr key={`${line.title}-${index}`} className="border-b border-neutral-200">
                  <td className="py-3 pe-2 align-middle text-start">
                    <p className="font-semibold leading-snug">{line.title}</p>
                    {line.detail ? (
                      <p className="mt-1 text-[12px] leading-snug text-neutral-600">
                        {line.detail}
                      </p>
                    ) : null}
                    {index === 0 && invoice.notes ? (
                      <p className="mt-1 whitespace-pre-wrap text-[12px] text-neutral-500">
                        {invoice.notes}
                      </p>
                    ) : null}
                  </td>
                  <td className="py-3 text-center align-middle tabular-nums" dir="ltr">
                    {line.quantity}
                  </td>
                  <td className="py-3 text-center align-middle tabular-nums" dir="ltr">
                    {money(line.unitHt)}
                  </td>
                  <td className="py-3 text-center align-middle font-semibold tabular-nums" dir="ltr">
                    {money(line.totalHt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section
          className="invoice-totals mt-6 clear-both w-full"
          dir="ltr"
          style={{ textAlign: "right" }}
        >
          <dl
            className="inline-block w-[18rem] max-w-full space-y-2 text-[13px] text-right"
            dir="ltr"
          >
            <div className="flex w-full items-baseline justify-end gap-x-8">
              <dt className="text-neutral-500" dir={textDir}>
                {labels.totalHt}
              </dt>
              <dd className="min-w-[5.5rem] text-right font-medium tabular-nums" dir="ltr">
                {money(totals.totalHt)}
              </dd>
            </div>
            <div className="flex w-full items-baseline justify-end gap-x-8">
              <dt className="text-neutral-500" dir={textDir}>
                {labels.vat.replace("{rate}", String(vatPercent))}
              </dt>
              <dd className="min-w-[5.5rem] text-right font-medium tabular-nums" dir="ltr">
                {money(totals.vatAmount)}
              </dd>
            </div>
            <div className="flex w-full items-baseline justify-end gap-x-8 border-t border-neutral-900 pt-2.5 text-[15px] font-bold">
              <dt dir={textDir}>{labels.totalTtc}</dt>
              <dd className="min-w-[5.5rem] text-right tabular-nums" dir="ltr">
                {money(totals.totalTtc)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </article>
  );
}
