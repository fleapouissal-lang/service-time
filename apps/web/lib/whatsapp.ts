import { ensureServerEnv } from "@/lib/env-server";

/** Chiffres internationaux pour wa.me (sans +) */
export function phoneToWhatsAppDigits(phone: string): string {
  return normalizePhone(phone).replace(/\D/g, "");
}

export function normalizePhone(phone: string): string {
  const cleaned = phone.trim().replace(/[\s\-().]/g, "");

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  // Maroc : 06/07xxxxxxxx
  if (/^0[67]\d{8}$/.test(cleaned)) {
    return `+212${cleaned.slice(1)}`;
  }

  // Maroc sans 0 initial
  if (/^[67]\d{8}$/.test(cleaned)) {
    return `+212${cleaned}`;
  }

  // Arabie : 05xxxxxxxx
  if (/^05\d{8}$/.test(cleaned)) {
    return `+966${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith("212")) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith("966")) {
    return `+${cleaned}`;
  }

  if (/^\d+$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return cleaned;
}

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

  return `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(text)}`;
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

  return `https://wa.me/${phoneToWhatsAppDigits(clientPhone)}?text=${encodeURIComponent(text)}`;
}
