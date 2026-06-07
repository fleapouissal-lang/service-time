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
import { getClientSparePartOrder } from "@/lib/spare-part-orders-queries";
import type {
  SparePartOrderStatus,
  SparePartPaymentMethod,
} from "@service-time/types";

export type SparePartOrderFormState = {
  error?: string;
};

function mapOrderError(message: string): string {
  if (message.includes("الكمية غير كافية")) return message;
  if (message.includes("insufficient_stock")) {
    return "الكمية المطلوبة غير متوفرة في المخزون";
  }
  if (message.includes("part_unavailable") || message.includes("قطعة غير متاحة")) {
    return "إحدى القطع غير متاحة حالياً";
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
    return { error: "سلة غير صالحة" };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "السلة فارغة" };
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
    return { error: mapOrderError(error.message) };
  }

  const row = (data as { id: string; order_token: string }[] | null)?.[0];
  if (!row) {
    return { error: "فشل إنشاء الطلب" };
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
          : "تعذر بدء الدفع. حاول مرة أخرى.",
    };
  }
}
