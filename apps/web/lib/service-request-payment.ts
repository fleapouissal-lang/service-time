import type { ServiceRequest } from "@service-time/types";

type PaymentSlice = Pick<
  ServiceRequest,
  | "client_proposed_price"
  | "quote_status"
  | "agreed_price"
  | "payment_method"
  | "payment_status"
>;

/** Demande avec prix négocié et accord obtenu. */
export function requiresServicePayment(order: PaymentSlice): boolean {
  return (
    order.client_proposed_price != null && order.quote_status === "accepted"
  );
}

/** Le client doit encore choisir ou finaliser le paiement en ligne. */
export function isPaymentBlockingAssignment(order: PaymentSlice): boolean {
  if (!requiresServicePayment(order)) return false;
  if (order.payment_status === "paid") return false;
  if (order.payment_method === "cash_on_delivery") return false;
  return true;
}

export function canClientChangePaymentMethod(order: PaymentSlice): boolean {
  return (
    requiresServicePayment(order) &&
    order.payment_status !== "paid" &&
    order.payment_method != null
  );
}

export function canClientChoosePayment(order: PaymentSlice): boolean {
  return (
    requiresServicePayment(order) &&
    order.payment_status !== "paid" &&
    order.payment_method == null
  );
}

export function canClientPayOnline(order: PaymentSlice): boolean {
  return (
    requiresServicePayment(order) &&
    order.payment_method === "online" &&
    order.payment_status !== "paid"
  );
}

export const SERVICE_REQUEST_PAYMOB_REFERENCE_PREFIX = "sr:";

export function buildServiceRequestPaymobReference(requestId: string): string {
  return `${SERVICE_REQUEST_PAYMOB_REFERENCE_PREFIX}${requestId}`;
}

export function parseServiceRequestPaymobReference(
  reference: string,
): string | null {
  if (!reference.startsWith(SERVICE_REQUEST_PAYMOB_REFERENCE_PREFIX)) {
    return null;
  }
  const id = reference.slice(SERVICE_REQUEST_PAYMOB_REFERENCE_PREFIX.length);
  return id || null;
}
