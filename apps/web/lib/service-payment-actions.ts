"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuthServerClient, requireProfile } from "@/lib/auth";
import { getAppBaseUrl } from "@/lib/app-base-url";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import {
  buildPaymobCheckoutUrl,
  createPaymobIntention,
  getPaymobConfigurationError,
  normalizePaymobPhone,
  splitFullName,
} from "@/lib/paymob";
import { getRequestById } from "@/lib/dashboard-queries";
import {
  buildServiceRequestPaymobReference,
  canClientPayOnline,
} from "@/lib/service-request-payment";
import { revalidateServiceRequestDashboards } from "@/lib/revalidate-service-request-paths";
import type { QuoteActionState } from "@/lib/service-quote-actions";

export type PaymentActionState = QuoteActionState & {
  redirectTo?: string;
};

export async function clientSetServicePaymentMethodAction(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const t = getDictionary(await getLocale());
  const profile = await requireProfile(["client"]);
  if (!profile) return { error: t.errors.request.loginRequired };

  const requestId = String(formData.get("request_id") ?? "").trim();
  const paymentMethod = String(formData.get("payment_method") ?? "").trim();
  if (!requestId) return { error: t.errors.quote.invalidRequest };
  if (
    paymentMethod !== "online" &&
    paymentMethod !== "cash_on_delivery"
  ) {
    return { error: t.errors.servicePayment.invalidMethod };
  }

  const supabase = await createAuthServerClient();
  const { error } = await supabase.rpc("client_set_service_request_payment", {
    p_request_id: requestId,
    p_payment_method: paymentMethod,
  });

  if (error) {
    console.error("[client_set_service_request_payment]", error.message);
    return { error: t.errors.servicePayment.actionFailed };
  }

  const order = await getRequestById(requestId);

  revalidatePath(`/client/orders/${requestId}`);
  revalidatePath(`/client/requests/pay/${requestId}`);
  revalidatePath("/client/orders");
  revalidatePath("/client/track");
  revalidateServiceRequestDashboards();

  if (paymentMethod === "online") {
    return {
      success: true,
      redirectTo: `/client/requests/pay/${requestId}`,
    };
  }

  return {
    success: true,
    redirectTo: order
      ? `/client/track/${order.tracking_token}`
      : "/client/orders",
  };
}

export async function adminMarkServiceRequestPaidAction(
  _prev: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  const t = getDictionary(await getLocale());
  const profile = await requireProfile(["admin"]);
  if (!profile) return { error: t.errors.admin.unauthorized };

  const requestId = String(formData.get("request_id") ?? "").trim();
  const reference = String(formData.get("payment_reference") ?? "").trim();
  if (!requestId) return { error: t.errors.quote.invalidRequest };

  const supabase = await createAuthServerClient();
  const { error } = await supabase.rpc("admin_mark_service_request_paid", {
    p_request_id: requestId,
    p_reference: reference || null,
  });

  if (error) {
    return { error: t.errors.servicePayment.actionFailed };
  }

  revalidatePath(`/admin/orders/${requestId}`);
  revalidatePath("/admin/orders");
  revalidateServiceRequestDashboards();
  return { success: true };
}

export async function startServiceRequestPaymobCheckoutAction(
  requestId: string,
): Promise<{ error?: string }> {
  const profile = await requireProfile(["client"]);
  if (!profile) {
    redirect(`/login?next=/client/requests/pay/${requestId}`);
  }

  const configError = getPaymobConfigurationError();
  if (configError) {
    return { error: configError };
  }

  const order = await getRequestById(requestId);
  if (!order || order.client_id !== profile.id) {
    redirect("/client/orders");
  }

  if (!canClientPayOnline(order)) {
    redirect(`/client/orders/${requestId}`);
  }

  if (order.payment_status === "paid") {
    redirect(`/client/track/${order.tracking_token}?payment=1`);
  }

  const amount = Number(order.agreed_price);
  if (!Number.isFinite(amount) || amount <= 0) {
    const t = getDictionary(await getLocale());
    return { error: t.errors.servicePayment.invalidAmount };
  }

  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const appUrl = await getAppBaseUrl();
  const { first_name, last_name } = splitFullName(profile.full_name);

  try {
    const intention = await createPaymobIntention({
      amountSar: amount,
      orderId: requestId,
      orderToken: order.tracking_token,
      billing: {
        first_name,
        last_name,
        email: user?.email ?? `client+${profile.id}@servicetime.local`,
        phone_number: normalizePaymobPhone(profile.phone ?? order.customer_phone),
      },
      redirectionUrl: `${appUrl}/client/requests/pay/${requestId}`,
      notificationUrl: `${appUrl}/api/payments/paymob/webhook`,
      itemName: `طلب صيانة ${order.tracking_token}`,
      specialReference: buildServiceRequestPaymobReference(requestId),
    });

    redirect(buildPaymobCheckoutUrl(intention.clientSecret));
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : getDictionary(await getLocale()).errors.servicePayment
              .paymentStartFailed,
    };
  }
}
