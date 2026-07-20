import type { Invoice } from "@service-time/types";
import { createAuthServerClient } from "@/lib/auth";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export type InvoiceLineItem = {
  title: string;
  quantity: number;
  unitHt: number;
  totalHt: number;
};

function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/** One row per product (or a single "Service" row). */
export async function getInvoiceLineItems(
  invoice: Invoice,
  serviceLabel: string,
  fallbackProductLabel: string,
  deliveryLabel: string,
  options?: { asAdmin?: boolean },
): Promise<InvoiceLineItem[]> {
  const invoiceAmount = roundMoney(Number(invoice.amount) || 0);

  if (invoice.source_type === "service_request") {
    return [
      {
        title: serviceLabel,
        quantity: 1,
        unitHt: invoiceAmount,
        totalHt: invoiceAmount,
      },
    ];
  }

  if (!invoice.spare_part_order_id) {
    return [
      {
        title: fallbackProductLabel,
        quantity: 1,
        unitHt: invoiceAmount,
        totalHt: invoiceAmount,
      },
    ];
  }

  const supabase = options?.asAdmin
    ? getAdminSupabaseClient()
    : await createAuthServerClient();

  if (!supabase) {
    return [
      {
        title: fallbackProductLabel,
        quantity: 1,
        unitHt: invoiceAmount,
        totalHt: invoiceAmount,
      },
    ];
  }

  const [{ data: items }, { data: order }] = await Promise.all([
    supabase
      .from("spare_part_order_items")
      .select("name_snapshot, quantity, price_snapshot")
      .eq("order_id", invoice.spare_part_order_id)
      .order("created_at", { ascending: true }),
    supabase
      .from("spare_part_orders")
      .select("delivery_fee")
      .eq("id", invoice.spare_part_order_id)
      .maybeSingle(),
  ]);

  const lines: InvoiceLineItem[] = (items ?? []).map((item) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const unitHt = roundMoney(Number(item.price_snapshot) || 0);
    return {
      title: item.name_snapshot?.trim() || fallbackProductLabel,
      quantity,
      unitHt,
      totalHt: roundMoney(unitHt * quantity),
    };
  });

  const deliveryFee = roundMoney(Number(order?.delivery_fee) || 0);
  if (deliveryFee > 0) {
    lines.push({
      title: deliveryLabel,
      quantity: 1,
      unitHt: deliveryFee,
      totalHt: deliveryFee,
    });
  }

  if (!lines.length) {
    return [
      {
        title: fallbackProductLabel,
        quantity: 1,
        unitHt: invoiceAmount,
        totalHt: invoiceAmount,
      },
    ];
  }

  return lines;
}
