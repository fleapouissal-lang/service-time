import type { Invoice, ServiceType } from "@service-time/types";
import { createAuthServerClient } from "@/lib/auth";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export type InvoiceLineItem = {
  title: string;
  /** Sub-service / extra line detail under the title. */
  detail?: string | null;
  quantity: number;
  unitHt: number;
  totalHt: number;
};

type CatalogCategory = {
  id: string;
  title: string;
  subOptions: readonly { id: string; label: string }[];
};

function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/** Prefill format: "Parent — Child" (em/en/hyphen dash). */
function parseParentChildFromDescription(
  description: string | null,
): { parent: string; child: string } | null {
  if (!description?.trim()) return null;
  const firstLine = description.trim().split(/\r?\n/)[0]?.trim() ?? "";
  const match = firstLine.match(/^(.{1,120}?)\s*[—–−-]\s+(.+)$/u);
  if (!match) return null;
  const parent = match[1].trim();
  const child = match[2].trim();
  if (!parent || !child || parent.length > 100) return null;
  return { parent, child };
}

function resolveFromCatalog(
  description: string | null,
  categories: readonly CatalogCategory[],
): { parent: string; child: string } | null {
  if (!description?.trim() || !categories.length) return null;
  const text = description.trim();
  for (const category of categories) {
    for (const sub of category.subOptions) {
      const label = `${category.title} — ${sub.label}`;
      if (text === label || text.startsWith(`${label}\n`) || text.startsWith(`${label} `)) {
        return { parent: category.title, child: sub.label };
      }
    }
  }
  return null;
}

async function resolveServiceLine(
  invoice: Invoice,
  serviceLabel: string,
  options?: {
    asAdmin?: boolean;
    serviceTypeLabels?: Partial<Record<ServiceType, string>>;
    catalogCategories?: readonly CatalogCategory[];
  },
): Promise<InvoiceLineItem> {
  const invoiceAmount = roundMoney(Number(invoice.amount) || 0);

  if (!invoice.service_request_id) {
    return {
      title: serviceLabel,
      quantity: 1,
      unitHt: invoiceAmount,
      totalHt: invoiceAmount,
    };
  }

  const supabase = options?.asAdmin
    ? getAdminSupabaseClient()
    : await createAuthServerClient();

  if (!supabase) {
    return {
      title: serviceLabel,
      quantity: 1,
      unitHt: invoiceAmount,
      totalHt: invoiceAmount,
    };
  }

  const { data: request } = await supabase
    .from("service_requests")
    .select("description, service_type")
    .eq("id", invoice.service_request_id)
    .maybeSingle();

  const description = request?.description ?? null;
  const serviceType = request?.service_type as ServiceType | undefined;
  const typeLabel =
    (serviceType && options?.serviceTypeLabels?.[serviceType]) || serviceLabel;

  const resolved =
    resolveFromCatalog(description, options?.catalogCategories ?? []) ??
    parseParentChildFromDescription(description);

  if (resolved) {
    return {
      title: resolved.parent,
      detail: resolved.child,
      quantity: 1,
      unitHt: invoiceAmount,
      totalHt: invoiceAmount,
    };
  }

  return {
    title: typeLabel || serviceLabel,
    detail: description?.trim() || null,
    quantity: 1,
    unitHt: invoiceAmount,
    totalHt: invoiceAmount,
  };
}

/** One row per product, or one service row with parent + child detail. */
export async function getInvoiceLineItems(
  invoice: Invoice,
  serviceLabel: string,
  fallbackProductLabel: string,
  deliveryLabel: string,
  options?: {
    asAdmin?: boolean;
    serviceTypeLabels?: Partial<Record<ServiceType, string>>;
    catalogCategories?: readonly CatalogCategory[];
  },
): Promise<InvoiceLineItem[]> {
  const invoiceAmount = roundMoney(Number(invoice.amount) || 0);

  if (invoice.source_type === "service_request") {
    return [await resolveServiceLine(invoice, serviceLabel, options)];
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
