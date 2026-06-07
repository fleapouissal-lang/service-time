"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createAuthServerClient } from "@/lib/auth";
import {
  buildPaymobCheckoutUrl,
  createPaymobIntention,
  getPaymobConfigurationError,
  normalizePaymobPhone,
  splitFullName,
} from "@/lib/paymob";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { getClientSparePartOrder } from "@/lib/spare-part-orders-queries";
import type {
  SparePartOrderStatus,
  SparePartPaymentMethod,
} from "@service-time/types";

export type SparePartOrderFormState = {
  error?: string;
};

async function mapOrderError(message: string): Promise<string> {
  const t = getDictionary(await getLocale());
  if (message.includes("الكمية غير كافية")) return message;
  if (message.includes("insufficient_stock")) {
    return t.errors.spareParts.insufficientStock;
  }
  if (message.includes("part_unavailable") || message.includes("قطعة غير متاحة")) {
    return t.errors.spareParts.partUnavailable;
  }
  return message;
}

export async function submitSparePartOrderAction(
  _prev: SparePartOrderFormState,
  formData: FormData,
): Promise<SparePartOrderFormState> {
  const profile = await requireProfile(["client"]);
  if (!profile) {
    redirect("/login?next=/spare-parts/checkout");
  }

  const notes = String(formData.get("notes") ?? "").trim();
  const itemsRaw = String(formData.get("items") ?? "");
  const paymentMethodRaw = String(
    formData.get("payment_method") ?? "cash_on_delivery",
  ) as SparePartPaymentMethod;

  const payment_method: SparePartPaymentMethod =
    paymentMethodRaw === "online" ? "online" : "cash_on_delivery";

  let items: { id: string; quantity: number }[];
  try {
    const parsed = JSON.parse(itemsRaw) as { id: string; quantity: number }[];
    items = parsed;
  } catch {
    const t = getDictionary(await getLocale());
    return { error: t.errors.spareParts.invalidCart };
  }

  if (!Array.isArray(items) || items.length === 0) {
    const t = getDictionary(await getLocale());
    return { error: t.errors.spareParts.emptyCart };
  }

  const payload = items.map((item) => ({
    spare_part_id: item.id,
    quantity: item.quantity,
  }));

  const supabase = await createAuthServerClient();
  const { data, error } = await supabase.rpc("create_spare_part_order", {
    p_notes: notes || null,
    p_items: payload,
    p_payment_method: payment_method,
  });

  if (error) {
    if (error.message.includes("client_required")) {
      redirect("/login?next=/spare-parts/checkout");
    }
    return { error: await mapOrderError(error.message) };
  }

  const row = (data as { id: string; order_token: string }[] | null)?.[0];
  if (!row) {
    const t = getDictionary(await getLocale());
    return { error: t.errors.spareParts.createFailed };
  }

  revalidatePath("/admin/spare-parts");
  revalidatePath("/spare-parts");
  revalidatePath("/client/spare-part-orders");
  revalidatePath("/admin/spare-part-orders");

  if (payment_method === "online") {
    redirect(`/spare-parts/checkout/pay/${row.id}`);
  }

  redirect(`/client/spare-part-orders/${row.id}?success=1`);
}

export type UpdateSparePartOrderStatusState = {
  success?: boolean;
  error?: string;
};

export async function updateSparePartOrderStatusFormAction(
  _prev: UpdateSparePartOrderStatusState,
  formData: FormData,
): Promise<UpdateSparePartOrderStatusState> {
  try {
    const profile = await requireProfile(["admin"]);
    if (!profile) return { error: "Unauthorized" };

    const id = String(formData.get("id") ?? "");
    const status = String(formData.get("status") ?? "") as SparePartOrderStatus;

    const allowed: SparePartOrderStatus[] = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "delivered",
      "cancelled",
    ];

    if (!id || !allowed.includes(status)) {
      return { error: "Invalid data" };
    }

    const supabase = await createAuthServerClient();
    const { error } = await supabase
      .from("spare_part_orders")
      .update({ status })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/spare-part-orders");
    revalidatePath(`/admin/spare-part-orders/${id}`);
    revalidatePath(`/client/spare-part-orders/${id}`);
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function updateSparePartOrderStatusAction(formData: FormData) {
  const profile = await requireProfile(["admin"]);
  if (!profile) return;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as SparePartOrderStatus;

  const allowed: SparePartOrderStatus[] = [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "delivered",
    "cancelled",
  ];

  if (!id || !allowed.includes(status)) return;

  const supabase = await createAuthServerClient();
  await supabase.from("spare_part_orders").update({ status }).eq("id", id);

  revalidatePath("/admin/spare-parts");
  revalidatePath("/admin/spare-part-orders");
  revalidatePath(`/client/spare-part-orders/${id}`);
}

async function getAppBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (
    envUrl &&
    !envUrl.includes("votre-domaine") &&
    !envUrl.includes("localhost")
  ) {
    return envUrl.replace(/\/$/, "");
  }

  if (host) {
    return `${protocol}://${host}`;
  }

  return envUrl?.replace(/\/$/, "") ?? "http://localhost:3000";
}

export async function startPaymobCheckoutAction(
  orderId: string,
): Promise<{ error?: string }> {
  const profile = await requireProfile(["client"]);
  if (!profile) {
    redirect(`/login?next=/spare-parts/checkout/pay/${orderId}`);
  }

  const configError = getPaymobConfigurationError();
  if (configError) {
    return { error: configError };
  }

  const order = await getClientSparePartOrder(profile.id, orderId);
  if (!order || order.payment_method !== "online") {
    redirect("/client/spare-part-orders");
  }

  if (order.payment_status === "paid") {
    redirect(`/client/spare-part-orders/${orderId}?success=1`);
  }

  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const appUrl = await getAppBaseUrl();
  const { first_name, last_name } = splitFullName(profile.full_name);

  try {
    const intention = await createPaymobIntention({
      amountSar: Number(order.total_amount) || 0,
      orderId,
      orderToken: order.order_token,
      billing: {
        first_name,
        last_name,
        email: user?.email ?? `client+${profile.id}@servicetime.local`,
        phone_number: normalizePaymobPhone(profile.phone),
      },
      redirectionUrl: `${appUrl}/spare-parts/checkout/pay/${orderId}`,
      notificationUrl: `${appUrl}/api/payments/paymob/webhook`,
    });

    redirect(buildPaymobCheckoutUrl(intention.clientSecret));
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : getDictionary(await getLocale()).errors.spareParts.paymentStartFailed,
    };
  }
}
