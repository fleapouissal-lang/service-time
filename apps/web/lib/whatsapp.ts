import { ensureServerEnv } from "@/lib/env-server";
import {
  buildWaMeUrl,
  buildWhatsAppOrderTrackingToClientMessage,
  normalizePhone,
  phoneToWhatsAppDigits,
} from "@/lib/whatsapp-utils";

export {
  normalizePhone,
  phoneToWhatsAppDigits,
  buildWhatsAppOrderTrackingToClientMessage,
  buildWhatsAppOrderCreatedToAdminMessage,
  buildWhatsAppQuickContactUrl,
} from "@/lib/whatsapp-utils";

export function getWhatsAppNumber(): string {
  ensureServerEnv();
  const raw = process.env.WHATSAPP_NUMBER?.trim() ?? "";
  if (!raw) {
    return "966500000001";
  }
  return phoneToWhatsAppDigits(raw);
}

/** Le client envoie son code au numéro WhatsApp de l'entreprise */
export function buildWhatsAppVerificationUrl(
  phone: string,
  code: string,
  fullName: string,
): string {
  const text = [
    "مرحباً Service Time، أريد تفعيل حسابي.",
    `الاسم: ${fullName}`,
    `الجوال: ${normalizePhone(phone)}`,
    `رمز التحقق: ${code}`,
  ].join("\n");

  return buildWaMeUrl(getWhatsAppNumber(), text);
}

/** Lien pour que l'admin envoie le code au client via WhatsApp */
export function buildWhatsAppSendCodeToClientUrl(
  clientPhone: string,
  code: string,
  fullName: string,
): string {
  const text = [
    `مرحباً ${fullName}،`,
    "رمز تفعيل حسابك في Service Time:",
    code,
    "أدخل هذا الرمز في صفحة التسجيل لتفعيل حسابك.",
  ].join("\n");

  return buildWaMeUrl(phoneToWhatsAppDigits(clientPhone), text);
}

export function buildWhatsAppOrderTrackingToClientUrl(
  clientPhone: string,
  payload: {
    customerName: string;
    trackingToken: string;
    trackUrl: string;
  },
): string {
  return buildWaMeUrl(
    phoneToWhatsAppDigits(clientPhone),
    buildWhatsAppOrderTrackingToClientMessage(payload),
  );
}
