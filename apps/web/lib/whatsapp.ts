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
    return "966583814214";
  }
  return phoneToWhatsAppDigits(raw);
}

/** Le client contacte l'entreprise pour l'aide à l'activation (sans code dans l'URL). */
export function buildWhatsAppVerificationUrl(
  phone: string,
  fullName: string,
): string {
  const text = [
    "مرحباً Service Time، أريد تفعيل حسابي.",
    `الاسم: ${fullName}`,
    `الجوال: ${normalizePhone(phone)}`,
    "رمز التحقق موجود في بريدي الإلكتروني.",
  ].join("\n");

  return buildWaMeUrl(getWhatsAppNumber(), text);
}

/** Lien d'aide WhatsApp pour l'inscription — sans code sensible dans l'URL. */
export function buildWhatsAppRegistrationHelpUrl(
  phone: string,
  fullName: string,
): string {
  return buildWhatsAppVerificationUrl(phone, fullName);
}

/** @deprecated Use buildWhatsAppRegistrationHelpUrl — kept for import compatibility. */
export function buildWhatsAppSendCodeToClientUrl(
  clientPhone: string,
  _code: string,
  fullName: string,
): string {
  return buildWhatsAppRegistrationHelpUrl(clientPhone, fullName);
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
