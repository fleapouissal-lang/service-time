import type { ServiceRequest } from "@service-time/types";
import { getEffectiveQuotePrice } from "@/lib/suggest-service-price";
import { requiresServicePayment } from "@/lib/service-request-payment";

export type ClientOrderFinancialKind =
  | "none"
  | "awaiting_admin"
  | "counter_offer"
  | "choose_payment"
  | "pay_online"
  | "pay_cash"
  | "paid"
  | "payment_failed";

export type ClientOrderFinancialStatus = {
  kind: ClientOrderFinancialKind;
  amount: number | null;
};

type OrderSlice = Pick<
  ServiceRequest,
  | "client_proposed_price"
  | "admin_counter_price"
  | "agreed_price"
  | "quote_status"
  | "payment_method"
  | "payment_status"
>;

/** Statut prix / paiement simplifié pour le client. */
export function getClientOrderFinancialStatus(
  order: OrderSlice,
): ClientOrderFinancialStatus {
  if (order.client_proposed_price == null) {
    return { kind: "none", amount: null };
  }

  if (!requiresServicePayment(order)) {
    if (order.quote_status === "admin_countered") {
      const amount = getEffectiveQuotePrice(order);
      return { kind: "counter_offer", amount };
    }

    if (
      order.quote_status === "pending_admin" ||
      order.quote_status === null ||
      order.quote_status === "declined"
    ) {
      return {
        kind: "awaiting_admin",
        amount: order.client_proposed_price,
      };
    }

    return { kind: "none", amount: null };
  }

  const amount = getEffectiveQuotePrice(order);

  if (order.payment_status === "paid") {
    return { kind: "paid", amount };
  }

  if (order.payment_status === "failed") {
    return { kind: "payment_failed", amount };
  }

  if (order.payment_method === "online") {
    return { kind: "pay_online", amount };
  }

  if (order.payment_method === "cash_on_delivery") {
    return { kind: "pay_cash", amount };
  }

  return { kind: "choose_payment", amount };
}
