import type { ExecutionMethod, ServiceType } from "@service-time/types";
import { ensureServerEnv } from "@/lib/env-server";
import {
  sendOrderCreatedAdminEmail,
  sendOrderCreatedClientEmail,
} from "@/lib/send-email";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import {
  buildWhatsAppOrderTrackingToClientMessage,
  buildWhatsAppOrderTrackingToClientUrl,
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
