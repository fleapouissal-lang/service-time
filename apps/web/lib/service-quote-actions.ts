"use server";

import { revalidatePath } from "next/cache";
import { createAuthServerClient, requireProfile } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { revalidateServiceRequestDashboards } from "@/lib/revalidate-service-request-paths";

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

  revalidatePath(`/client/orders/${requestId}`);
  revalidatePath("/client/orders");
  revalidatePath("/client/track");
  revalidateServiceRequestDashboards();
  return { success: true };
}
