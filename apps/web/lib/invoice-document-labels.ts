import type { Messages } from "@/messages/types";
import type { InvoiceDocumentLabels } from "@/components/invoices/invoice-document";

export function buildInvoiceDocumentLabels(
  t: Messages,
  scope: "admin" | "client",
): InvoiceDocumentLabels {
  const doc =
    scope === "admin"
      ? t.dashboard.admin.invoicesPage.document
      : t.dashboard.client.invoicesPage.document;

  return {
    title: doc.title,
    brand: t.common.brandName,
    company: doc.company,
    email: doc.email,
    website: doc.website,
    location: doc.location,
    phoneCompany: doc.phoneCompany,
    taxIdLabel: doc.taxIdLabel,
    taxIdValue: doc.taxIdValue,
    regIdLabel: doc.regIdLabel,
    regIdValue: doc.regIdValue,
    invoiceNumber: doc.invoiceNumber,
    date: doc.date,
    dueDate: doc.dueDate,
    client: doc.client,
    phone: doc.phone,
    companyName: doc.companyName,
    ice: doc.ice,
    clientEmail: doc.clientEmail,
    clientAddress: doc.clientAddress,
    designation: doc.designation,
    serviceLine: doc.serviceLine,
    productFallback: doc.productFallback,
    deliveryLine: doc.deliveryLine,
    qty: doc.qty,
    unitHt: doc.unitHt,
    totalHtCol: doc.totalHtCol,
    totalHt: doc.totalHt,
    vat: doc.vat,
    totalTtc: doc.totalTtc,
    bankDetails: doc.bankDetails,
    bankInfo: doc.bankInfo,
    thankYou: doc.thankYou,
    page: doc.page,
    notes: doc.notes,
  };
}
