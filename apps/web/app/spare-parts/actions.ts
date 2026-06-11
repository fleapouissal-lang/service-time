"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createAuthServerClient } from "@/lib/auth";
import { getAppBaseUrl } from "@/lib/app-base-url";
import {
  contactValidationErrorMessage,
  validateRequiredContact,
} from "@/lib/contact-validation";
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
import { clampField, FIELD_LIMITS } from "@/lib/form-security";
import type {
  SparePartOrderStatus,
  SparePartPaymentMethod,
} from "@service-time/types";

export type SparePartOrderFormState = {
  error?: string;
};

export type SparePartsCheckoutPrefill = {
  fullName: string;
  phone: string;
  email: string;
};

export async function getSparePartsCheckoutPrefillAction(): Promise<SparePartsCheckoutPrefill | null> {
  const profile = await requireProfile(["client"]);
  if (!profile) return null;

  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    fullName: profile.full_name,
    phone: profile.phone ?? "",
    email: user?.email ?? "",
  };
}

async function mapOrderError(message: string): Promise<string> {
  const t = getDictionary(await getLocale());
  if (message.includes("الكمية غير كافية")) return message;
  if (message.includes("insufficient_stock")) {
    return t.errors.spareParts.insufficientStock;
  }
  if (message.includes("part_unavailable") || message.includes("قطعة غير متاحة")) {
    return t.errors.spareParts.partUnavailable;
  }
  if (message.includes("customer_name_required")) {
    return t.checkout.errors.nameRequired;
  }
  if (message.includes("customer_phone_required")) {
    return t.checkout.errors.phoneRequired;
  }
  if (message.includes("customer_email_required")) {
    return t.checkout.errors.emailRequired;
  }
  if (message.includes("delivery_address_required")) {
    return t.checkout.errors.addressRequired;
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

  const customerFullName = clampField(
    String(formData.get("customer_full_name") ?? ""),
    FIELD_LIMITS.name,
  );
  const customerPhoneRaw = clampField(
    String(formData.get("customer_phone") ?? ""),
    FIELD_LIMITS.phone,
  );
  const customerEmailRaw = clampField(
    String(formData.get("customer_email") ?? ""),
    FIELD_LIMITS.email,
  );
  const deliveryAddress = clampField(
    String(formData.get("delivery_address") ?? ""),
    FIELD_LIMITS.location,
  );

  const t = getDictionary(await getLocale());
  const contactMessages = {
    emailRequired: t.errors.contact.emailRequired,
    invalidEmail: t.errors.contact.invalidEmail,
    phoneRequired: t.errors.contact.phoneRequired,
    invalidPhone: t.errors.contact.invalidPhone,
  };

  if (customerFullName.length < 2) {
    return { error: t.checkout.errors.nameRequired };
  }

  const contact = validateRequiredContact(customerEmailRaw, customerPhoneRaw);
  if (!contact.ok) {
    return {
      error: contactValidationErrorMessage(contact.error, contactMessages),
    };
  }

  if (deliveryAddress.length < 5) {
    return { error: t.checkout.errors.addressRequired };
  }

  const payment_method: SparePartPaymentMethod =
    paymentMethodRaw === "online" ? "online" : "cash_on_delivery";

  let items: { id: string; quantity: number }[];
  try {
    const parsed = JSON.parse(itemsRaw) as { id: string; quantity: number }[];
    items = parsed;
  } catch {
    return { error: t.errors.spareParts.invalidCart };
  }

  if (!Array.isArray(items) || items.length === 0) {
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
    p_customer_full_name: customerFullName,
    p_customer_phone: contact.phone,
    p_customer_email: contact.email,
    p_delivery_address: deliveryAddress,
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
  const billingName = order.customer_full_name?.trim() || profile.full_name;
  const { first_name, last_name } = splitFullName(billingName);
  const billingPhone = order.customer_phone?.trim() || profile.phone;
  const billingEmail =
    order.customer_email?.trim() || user?.email || `client+${profile.id}@servicetime.local`;

  try {
    const intention = await createPaymobIntention({
      amountSar: Number(order.total_amount) || 0,
      orderId,
      orderToken: order.order_token,
      billing: {
        first_name,
        last_name,
        email: billingEmail,
        phone_number: normalizePaymobPhone(billingPhone),
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
