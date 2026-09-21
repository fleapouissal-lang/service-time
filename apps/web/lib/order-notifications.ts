import type { ExecutionMethod, ServiceType } from "@service-time/types";
import { ensureServerEnv } from "@/lib/env-server";
import {
  sendOrderCreatedAdminEmail,
  sendOrderCreatedClientEmail,
  sendOrderStatusClientEmail,
  sendQuoteAcceptedAdminEmail,
  sendQuoteAcceptedClientEmail,
  sendQuotePriceClientEmail,
} from "@/lib/send-email";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import {
  buildWhatsAppOrderTrackingToClientMessage,
  buildWhatsAppOrderTrackingToClientUrl,
  buildWhatsAppQuotePriceToClientMessage,
  normalizePhone,
} from "@/lib/whatsapp";
import { sendWhatsAppMessage } from "@/lib/whatsapp-send";

export type OrderCreatedNotificationPayload = {
  requestId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  trackingToken: string;
  serviceType: ServiceType;
  executionMethod: ExecutionMethod;
  serviceTypeLabel: string;
  executionMethodLabel: string;
  carType: string | null;
  locationText: string | null;
};

function getTrackUrl(trackingToken: string): string {
  ensureServerEnv();
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${base}/client/track/${encodeURIComponent(trackingToken)}`;
}

async function resolveCustomerEmail(
  clientId: string | null | undefined,
  fallback: string | null = null,
): Promise<string | null> {
  if (fallback?.trim()) return fallback.trim();
  if (!clientId) return null;
  const admin = getAdminSupabaseClient();
  if (!admin) return null;
  const { data } = await admin.auth.admin.getUserById(clientId);
  return data.user?.email ?? null;
}

async function logNotification(
  requestId: string,
  channel: "whatsapp" | "sms",
  event: string,
  status: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const admin = getAdminSupabaseClient();
  if (!admin) return;

  const { error } = await admin.from("notifications_log").insert({
    request_id: requestId,
    channel,
    event,
    status,
    payload,
  });

  if (error) {
    console.error("[order-notify] log:", error);
  }
}

/** Email + WhatsApp client et admin après création de commande. */
export async function notifyOrderCreated(
  payload: OrderCreatedNotificationPayload,
): Promise<void> {
  const trackUrl = getTrackUrl(payload.trackingToken);
  const phone = normalizePhone(payload.customerPhone);
  const whatsappClientUrl = buildWhatsAppOrderTrackingToClientUrl(phone, {
    customerName: payload.customerName,
    trackingToken: payload.trackingToken,
    trackUrl,
  });

  const clientWhatsAppText = buildWhatsAppOrderTrackingToClientMessage({
    customerName: payload.customerName,
    trackingToken: payload.trackingToken,
    trackUrl,
  });

  if (payload.customerEmail) {
    const mail = await sendOrderCreatedClientEmail({
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      trackingToken: payload.trackingToken,
      trackUrl,
      serviceTypeLabel: payload.serviceTypeLabel,
      whatsappClientUrl,
    });

    if (!mail.ok) {
      console.error("[order-notify] client email:", mail.error);
    }
  }

  const adminMail = await sendOrderCreatedAdminEmail({
    customerName: payload.customerName,
    customerPhone: phone,
    customerEmail: payload.customerEmail,
    trackingToken: payload.trackingToken,
    trackUrl,
    serviceTypeLabel: payload.serviceTypeLabel,
    executionMethodLabel: payload.executionMethodLabel,
    carType: payload.carType,
    locationText: payload.locationText,
    whatsappClientUrl,
  });

  if (!adminMail.ok) {
    console.error("[order-notify] admin email:", adminMail.error);
  }

  const clientWa = await sendWhatsAppMessage(phone, clientWhatsAppText);
  await logNotification(
    payload.requestId,
    "whatsapp",
    "order_created",
    clientWa.ok ? "sent" : "failed",
    {
      to: phone,
      tracking_token: payload.trackingToken,
      dev: "dev" in clientWa ? clientWa.dev : false,
      wa_url: clientWa.waUrl ?? whatsappClientUrl,
      error: clientWa.ok ? null : clientWa.error,
    },
  );
}

export type QuotePriceNotificationPayload = {
  requestId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  trackingToken: string;
  priceLabel: string;
};

/** WhatsApp (+ email si dispo) quand ops envoie le prix au client. */
export async function notifyQuotePriceSet(
  payload: QuotePriceNotificationPayload,
): Promise<void> {
  const trackUrl = getTrackUrl(payload.trackingToken);
  const phone = normalizePhone(payload.customerPhone);
  const text = buildWhatsAppQuotePriceToClientMessage({
    customerName: payload.customerName,
    priceLabel: payload.priceLabel,
    trackingToken: payload.trackingToken,
    trackUrl,
  });

  if (payload.customerEmail) {
    const mail = await sendQuotePriceClientEmail({
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      priceLabel: payload.priceLabel,
      trackingToken: payload.trackingToken,
      trackUrl,
    });
    if (!mail.ok) {
      console.error("[quote-notify] client email:", mail.error);
    }
  }

  const clientWa = await sendWhatsAppMessage(phone, text);
  await logNotification(
    payload.requestId,
    "whatsapp",
    "quote_price_set",
    clientWa.ok ? "sent" : "failed",
    {
      to: phone,
      tracking_token: payload.trackingToken,
      price: payload.priceLabel,
      error: clientWa.ok ? null : clientWa.error,
    },
  );
}

export type OrderStatusNotificationPayload = {
  requestId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  clientId?: string | null;
  trackingToken: string;
  statusLabel: string;
  serviceTypeLabel?: string;
};

/** Email (+ WhatsApp) عند تحديث حالة الطلب. */
export async function notifyOrderStatusUpdated(
  payload: OrderStatusNotificationPayload,
): Promise<void> {
  const trackUrl = getTrackUrl(payload.trackingToken);
  const phone = normalizePhone(payload.customerPhone);
  const customerEmail = await resolveCustomerEmail(
    payload.clientId,
    payload.customerEmail ?? null,
  );

  if (customerEmail) {
    const mail = await sendOrderStatusClientEmail({
      customerName: payload.customerName,
      customerEmail,
      statusLabel: payload.statusLabel,
      trackingToken: payload.trackingToken,
      trackUrl,
      serviceTypeLabel: payload.serviceTypeLabel,
    });
    if (!mail.ok) {
      console.error("[status-notify] client email:", mail.error);
    }
  }

  const text = [
    `مرحباً ${payload.customerName}،`,
    `تم تحديث حالة طلبك إلى: ${payload.statusLabel}`,
    `رمز التتبع: ${payload.trackingToken}`,
    `التتبع: ${trackUrl}`,
  ].join("\n");

  const clientWa = await sendWhatsAppMessage(phone, text);
  await logNotification(
    payload.requestId,
    "whatsapp",
    "order_status_updated",
    clientWa.ok ? "sent" : "failed",
    {
      to: phone,
      tracking_token: payload.trackingToken,
      status: payload.statusLabel,
      error: clientWa.ok ? null : clientWa.error,
    },
  );
}

export type QuoteAcceptedNotificationPayload = {
  requestId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  clientId?: string | null;
  trackingToken: string;
  priceLabel?: string;
};

/** إشعار اعتماد التسعيرة للعميل والإدارة. */
export async function notifyQuoteAccepted(
  payload: QuoteAcceptedNotificationPayload,
): Promise<void> {
  const trackUrl = getTrackUrl(payload.trackingToken);
  const customerEmail = await resolveCustomerEmail(
    payload.clientId,
    payload.customerEmail ?? null,
  );

  if (customerEmail) {
    const mail = await sendQuoteAcceptedClientEmail({
      customerName: payload.customerName,
      customerEmail,
      priceLabel: payload.priceLabel,
      trackingToken: payload.trackingToken,
      trackUrl,
    });
    if (!mail.ok) {
      console.error("[quote-accepted] client email:", mail.error);
    }
  }

  const adminMail = await sendQuoteAcceptedAdminEmail({
    customerName: payload.customerName,
    priceLabel: payload.priceLabel,
    trackingToken: payload.trackingToken,
    trackUrl,
  });
  if (!adminMail.ok) {
    console.error("[quote-accepted] admin email:", adminMail.error);
  }
}
