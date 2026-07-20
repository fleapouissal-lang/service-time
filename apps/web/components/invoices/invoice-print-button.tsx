"use client";

import { FileDown } from "lucide-react";
import type { Invoice } from "@service-time/types";
import { Button } from "@/components/ui/button";
import type { InvoiceDocumentLabels } from "@/components/invoices/invoice-document";
import type { Locale } from "@/lib/i18n/config";
import { getInvoiceLogoAbsoluteUrl } from "@/lib/invoice-branding";
import { formatInvoiceDate, formatInvoiceMoney } from "@/lib/invoice-format";
import type { InvoiceLineItem } from "@/lib/invoice-line-items";
import { addDaysIso, computeInvoiceTotals } from "@/lib/invoice-totals";

type InvoicePrintButtonProps = {
  invoice: Invoice;
  locale: Locale;
  labels: InvoiceDocumentLabels;
  lineItems: InvoiceLineItem[];
  buttonLabel: string;
  variant?: "default" | "outline";
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildInvoicePrintHtml(opts: {
  invoice: Invoice;
  locale: Locale;
  labels: InvoiceDocumentLabels;
  lineItems: InvoiceLineItem[];
}) {
  const { invoice, locale, labels, lineItems } = opts;
  const isAr = locale === "ar";
  const textDir = isAr ? "rtl" : "ltr";
  const issuedAt = new Date(invoice.validated_at ?? invoice.created_at);
  const dueAt = addDaysIso(issuedAt, 14);
  const totals = computeInvoiceTotals(Number(invoice.amount) || 0);
  const money = (value: number) => formatInvoiceMoney(value, locale);
  const vatPercent = Math.round(totals.vatRate * 100);
  const logoUrl = getInvoiceLogoAbsoluteUrl(locale);
  const clientRows = [
    invoice.customer_company_name
      ? `<div class="row"><span class="k">${escapeHtml(labels.companyName)}</span><span class="v">${escapeHtml(invoice.customer_company_name)}</span></div>`
      : "",
    invoice.customer_ice
      ? `<div class="row"><span class="k">${escapeHtml(labels.ice)}</span><span class="v" dir="ltr">${escapeHtml(invoice.customer_ice)}</span></div>`
      : "",
    invoice.customer_phone
      ? `<div class="row"><span class="k">${escapeHtml(labels.phone)}</span><span class="v" dir="ltr">${escapeHtml(invoice.customer_phone)}</span></div>`
      : "",
    invoice.customer_email
      ? `<div class="row"><span class="k">${escapeHtml(labels.clientEmail)}</span><span class="v" dir="ltr">${escapeHtml(invoice.customer_email)}</span></div>`
      : "",
    invoice.customer_address
      ? `<div class="row"><span class="k">${escapeHtml(labels.clientAddress)}</span><span class="v">${escapeHtml(invoice.customer_address)}</span></div>`
      : "",
  ].join("");

  const lineRows = lineItems
    .map((line, index) => {
      const detailHtml = line.detail
        ? `<p class="line-detail">${escapeHtml(line.detail)}</p>`
        : "";
      const notesHtml =
        index === 0 && invoice.notes
          ? `<div class="notes">${escapeHtml(invoice.notes)}</div>`
          : "";
      return `<tr>
          <td class="desc">
            <p class="line-title">${escapeHtml(line.title)}</p>
            ${detailHtml}
            ${notesHtml}
          </td>
          <td class="c" dir="ltr">${line.quantity}</td>
          <td class="c" dir="ltr">${escapeHtml(money(line.unitHt))}</td>
          <td class="c" dir="ltr"><strong>${escapeHtml(money(line.totalHt))}</strong></td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(labels.title)} ${escapeHtml(invoice.invoice_number)}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
    }
    body {
      font-family: "Segoe UI", Tahoma, "Noto Sans Arabic", Arial, sans-serif;
      color: #171717;
      direction: ltr;
    }
    .sheet {
      width: 100%;
      max-width: 186mm;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 32px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .logo { height: 72px; width: auto; object-fit: contain; display: block; }
    .meta { text-align: right; }
    .title {
      margin: 0;
      font-size: 36px;
      font-weight: 900;
      letter-spacing: -0.02em;
      line-height: 1;
    }
    .number {
      margin: 8px 0 0;
      font-family: ui-monospace, monospace;
      font-size: 14px;
      font-weight: 700;
      color: #404040;
    }
    .dates { margin-top: 16px; font-size: 12.5px; }
    .dates .row {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 6px;
    }
    .dates .lbl { color: #737373; font-weight: 700; }
    .dates .val { min-width: 5.5rem; font-variant-numeric: tabular-nums; font-weight: 600; }
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 24px;
      direction: ${textDir};
      text-align: ${isAr ? "right" : "left"};
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .card {
      border: none;
      padding: 0 0 0 16px;
      font-size: 12.5px;
      line-height: 1.45;
      color: #404040;
      min-height: 140px;
      text-align: ${isAr ? "right" : "left"};
      background: transparent;
    }
    .card.from {
      border-inline-end: 1px solid #e5e5e5;
      padding-inline-end: 16px;
      padding-inline-start: 0;
    }
    .card .name {
      margin: 0;
      font-size: 14px;
      font-weight: 800;
      color: #171717;
    }
    .card .sub {
      margin: 4px 0 0;
      font-size: 12.5px;
      color: #525252;
    }
    .rows { margin-top: 12px; }
    .row {
      display: ${isAr ? "flex" : "grid"};
      ${isAr
        ? "flex-wrap: wrap; justify-content: flex-start; gap: 6px 8px;"
        : "grid-template-columns: 7.5rem 1fr; gap: 10px;"}
      margin-bottom: 7px;
      align-items: baseline;
    }
    .row .k { color: #737373; }
    .row .v { font-weight: 600; color: #262626; word-break: break-word; }
    table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      margin-top: 28px;
      font-size: 12.5px;
      direction: ${textDir};
    }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    col.desc { width: auto; }
    col.qty { width: 4rem; }
    col.amt { width: 8rem; }
    th {
      border-top: 1px solid #171717;
      border-bottom: 1px solid #171717;
      padding: 9px 6px;
      font-size: 10px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      font-weight: 800;
      vertical-align: middle;
      background: #fff;
    }
    td {
      border-bottom: 1px solid #e5e5e5;
      padding: 12px 6px;
      vertical-align: middle;
    }
    .desc { text-align: start; }
    .c { text-align: center; font-variant-numeric: tabular-nums; }
    .line-title { margin: 0; font-weight: 700; }
    .line-detail { margin: 4px 0 0; font-size: 12px; color: #525252; line-height: 1.35; }
    .notes { margin-top: 4px; color: #737373; font-size: 11.5px; white-space: pre-wrap; }
    .totals-wrap {
      margin-top: 20px;
      width: 100%;
      direction: ltr;
      text-align: right;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .totals {
      display: inline-block;
      width: 288px;
      max-width: 100%;
      text-align: right;
      font-size: 12.5px;
      direction: ltr;
    }
    .totals .line {
      display: flex;
      justify-content: flex-end;
      align-items: baseline;
      gap: 24px;
      margin-bottom: 7px;
      color: #404040;
    }
    .totals .line span:last-child {
      min-width: 5.5rem;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
      text-align: right;
      direction: ltr;
    }
    .totals .ttc {
      border-top: 1px solid #171717;
      padding-top: 8px;
      margin-top: 6px;
      font-size: 14px;
      font-weight: 800;
      color: #171717;
    }
    @media screen {
      body { background: #e5e5e5; padding: 16px; }
      .sheet {
        background: #fff;
        min-height: 277mm;
        padding: 12mm;
        box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <header class="header">
      <img class="logo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(labels.brand)}" />
      <div class="meta">
        <h1 class="title" dir="${textDir}">${escapeHtml(labels.title)}</h1>
        <p class="number" dir="ltr">${escapeHtml(invoice.invoice_number)}</p>
        <div class="dates">
          <div class="row">
            <span class="lbl" dir="${textDir}">${escapeHtml(labels.date)}</span>
            <span class="val" dir="ltr">${escapeHtml(formatInvoiceDate(issuedAt))}</span>
          </div>
          <div class="row">
            <span class="lbl" dir="${textDir}">${escapeHtml(labels.dueDate)}</span>
            <span class="val" dir="ltr">${escapeHtml(formatInvoiceDate(dueAt))}</span>
          </div>
        </div>
      </div>
    </header>

    <section class="parties">
      <div class="card from">
        <p class="name">${escapeHtml(labels.brand)}</p>
        <p class="sub">${escapeHtml(labels.location)}</p>
        <div class="rows">
          <div class="row"><span class="k">${escapeHtml(labels.clientEmail)}</span><span class="v" dir="ltr">${escapeHtml(labels.email)}</span></div>
          <div class="row"><span class="k">Web</span><span class="v" dir="ltr">${escapeHtml(labels.website)}</span></div>
          <div class="row"><span class="k">${escapeHtml(labels.phone)}</span><span class="v" dir="ltr">${escapeHtml(labels.phoneCompany)}</span></div>
          <div class="row"><span class="k">${escapeHtml(labels.taxIdLabel)}</span><span class="v" dir="ltr">${escapeHtml(labels.taxIdValue)}</span></div>
          <div class="row"><span class="k">${escapeHtml(labels.regIdLabel)}</span><span class="v" dir="ltr">${escapeHtml(labels.regIdValue)}</span></div>
        </div>
      </div>
      <div class="card">
        <p class="name">${escapeHtml(invoice.customer_name)}</p>
        <div class="rows">${clientRows}</div>
      </div>
    </section>

    <table>
      <colgroup>
        <col class="desc" />
        <col class="qty" />
        <col class="amt" />
        <col class="amt" />
      </colgroup>
      <thead>
        <tr>
          <th class="desc">${escapeHtml(labels.designation)}</th>
          <th class="c">${escapeHtml(labels.qty)}</th>
          <th class="c">${escapeHtml(labels.unitHt)}</th>
          <th class="c">${escapeHtml(labels.totalHtCol)}</th>
        </tr>
      </thead>
      <tbody>
        ${lineRows}
      </tbody>
    </table>

    <div class="totals-wrap">
      <div class="totals">
        <div class="line">
          <span dir="${textDir}">${escapeHtml(labels.totalHt)}</span>
          <span dir="ltr">${escapeHtml(money(totals.totalHt))}</span>
        </div>
        <div class="line">
          <span dir="${textDir}">${escapeHtml(labels.vat.replace("{rate}", String(vatPercent)))}</span>
          <span dir="ltr">${escapeHtml(money(totals.vatAmount))}</span>
        </div>
        <div class="line ttc">
          <span dir="${textDir}">${escapeHtml(labels.totalTtc)}</span>
          <span dir="ltr">${escapeHtml(money(totals.totalTtc))}</span>
        </div>
      </div>
    </div>
  </div>
  <script>
    (function () {
      var printed = false;
      function triggerPrint() {
        if (printed) return;
        printed = true;
        try { window.focus(); window.print(); } catch (e) {}
      }
      if (document.readyState === "complete") {
        setTimeout(triggerPrint, 300);
      } else {
        window.addEventListener("load", function () {
          setTimeout(triggerPrint, 300);
        });
      }
      setTimeout(triggerPrint, 1500);
    })();
  </script>
</body>
</html>`;
}

function printHtmlDocument(html: string) {
  // Blob URL avoids blank tabs caused by window.open(..., "noopener").
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");

  if (printWindow) {
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  // Popup blocked: fall back to a hidden iframe.
  URL.revokeObjectURL(url);
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "invoice-print");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();
  window.setTimeout(() => iframe.remove(), 60_000);
}

export function InvoicePrintButton({
  invoice,
  locale,
  labels,
  lineItems,
  buttonLabel,
  variant = "outline",
}: InvoicePrintButtonProps) {
  function handlePrint() {
    const html = buildInvoicePrintHtml({
      invoice,
      locale,
      labels,
      lineItems,
    });
    printHtmlDocument(html);
  }

  return (
    <Button type="button" variant={variant} onClick={handlePrint}>
      <FileDown className="size-4" aria-hidden />
      {buttonLabel}
    </Button>
  );
}
