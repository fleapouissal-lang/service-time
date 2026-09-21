"use server";

import { revalidatePath } from "next/cache";
import { createAuthServerClient, requireProfile } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { notifyQuoteAccepted, notifyQuotePriceSet } from "@/lib/order-notifications";
import { revalidateServiceRequestDashboards } from "@/lib/revalidate-service-request-paths";
import { formatSparePartPrice } from "@/lib/format-price";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export type QuoteActionState = {
  success?: boolean;
  error?: string;
};

function parsePrice(raw: FormDataEntryValue | null): number | null {
  const value = Number(String(raw ?? "").trim());
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

export async function adminAcceptClientQuoteAction(
  _prev: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  const t = getDictionary(await getLocale());
  const locale = await getLocale();
  const profile = await requireProfile(["admin"]);
  if (!profile) return { error: t.errors.admin.unauthorized };

  const requestId = String(formData.get("request_id") ?? "").trim();
  if (!requestId) return { error: t.errors.quote.invalidRequest };

  const supabase = await createAuthServerClient();
  const { error } = await supabase.rpc("admin_accept_client_quote", {
    p_request_id: requestId,
  });

  if (error) {
    return { error: t.errors.quote.actionFailed };
  }

  const { data: order } = await supabase
    .from("service_requests")
    .select(
      "id, customer_name, customer_phone, tracking_token, client_id, agreed_price, client_proposed_price",
    )
    .eq("id", requestId)
    .maybeSingle();

  if (order) {
    const price =
      order.agreed_price != null
        ? Number(order.agreed_price)
        : order.client_proposed_price != null
          ? Number(order.client_proposed_price)
          : null;
    void notifyQuoteAccepted({
      requestId: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      clientId: order.client_id,
      trackingToken: order.tracking_token,
      priceLabel:
        price != null ? formatSparePartPrice(price, locale) : undefined,
    }).catch((err) => console.error("[quote] accept notify:", err));
  }

  revalidatePath(`/admin/orders/${requestId}`);
  revalidatePath("/admin/orders");
  revalidateServiceRequestDashboards();
  return { success: true };
}

export async function adminCounterQuoteAction(
  _prev: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  const t = getDictionary(await getLocale());
  const locale = await getLocale();
  const profile = await requireProfile(["admin"]);
  if (!profile) return { error: t.errors.admin.unauthorized };

  const requestId = String(formData.get("request_id") ?? "").trim();
  const counterPrice = parsePrice(formData.get("counter_price"));
  if (!requestId) return { error: t.errors.quote.invalidRequest };
  if (counterPrice == null) return { error: t.errors.quote.invalidPrice };

  const supabase = await createAuthServerClient();
  const { error } = await supabase.rpc("admin_counter_service_quote", {
    p_request_id: requestId,
    p_counter_price: counterPrice,
  });

  if (error) {
    return { error: t.errors.quote.actionFailed };
  }

  const { data: order } = await supabase
    .from("service_requests")
    .select(
      "id, customer_name, customer_phone, tracking_token, client_id, admin_counter_price",
    )
    .eq("id", requestId)
    .maybeSingle();

  if (order) {
    let customerEmail: string | null = null;
    if (order.client_id) {
      const admin = getAdminSupabaseClient();
      if (admin) {
        const { data: userData } = await admin.auth.admin.getUserById(
          order.client_id,
        );
        customerEmail = userData.user?.email ?? null;
      }
    }

    const price =
      order.admin_counter_price != null
        ? Number(order.admin_counter_price)
        : counterPrice;

    void notifyQuotePriceSet({
      requestId: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail,
      trackingToken: order.tracking_token,
      priceLabel: formatSparePartPrice(price, locale),
    }).catch((err) => console.error("[quote] notify:", err));
  }

  revalidatePath(`/admin/orders/${requestId}`);
  revalidatePath("/admin/orders");
  revalidateServiceRequestDashboards();
  return { success: true };
}

export async function clientAcceptCounterQuoteAction(
  _prev: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  const t = getDictionary(await getLocale());
  const locale = await getLocale();
  const profile = await requireProfile(["client"]);
  if (!profile) return { error: t.errors.request.loginRequired };

  const requestId = String(formData.get("request_id") ?? "").trim();
  if (!requestId) return { error: t.errors.quote.invalidRequest };

  const supabase = await createAuthServerClient();
  const { error } = await supabase.rpc("client_accept_counter_quote", {
    p_request_id: requestId,
  });

  if (error) {
    return { error: t.errors.quote.actionFailed };
  }

  const { data: order } = await supabase
    .from("service_requests")
    .select(
      "id, customer_name, customer_phone, tracking_token, client_id, agreed_price, admin_counter_price",
    )
    .eq("id", requestId)
    .maybeSingle();

  if (order) {
    const price =
      order.agreed_price != null
        ? Number(order.agreed_price)
        : order.admin_counter_price != null
          ? Number(order.admin_counter_price)
          : null;
    void notifyQuoteAccepted({
      requestId: order.id,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      clientId: order.client_id,
      trackingToken: order.tracking_token,
      priceLabel:
        price != null ? formatSparePartPrice(price, locale) : undefined,
    }).catch((err) => console.error("[quote] client accept notify:", err));
  }

  revalidatePath(`/client/orders/${requestId}`);
  revalidatePath("/client/orders");
  revalidatePath("/client/track");
  revalidateServiceRequestDashboards();
  return { success: true };
}
