/** Saudi VAT rate used on invoices (Autolog-style HT / TVA / TTC). */
export const INVOICE_VAT_RATE = 0.15;

export type InvoiceTotals = {
  quantity: number;
  unitHt: number;
  totalHt: number;
  vatRate: number;
  vatAmount: number;
  totalTtc: number;
};

/** `amount` on the invoice is treated as HT (excl. tax). */
export function computeInvoiceTotals(amount: number): InvoiceTotals {
  const totalHt = Math.max(0, Math.round((Number(amount) || 0) * 100) / 100);
  const vatAmount = Math.round(totalHt * INVOICE_VAT_RATE * 100) / 100;
  const totalTtc = Math.round((totalHt + vatAmount) * 100) / 100;
  return {
    quantity: 1,
    unitHt: totalHt,
    totalHt,
    vatRate: INVOICE_VAT_RATE,
    vatAmount,
    totalTtc,
  };
}

export function addDaysIso(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
