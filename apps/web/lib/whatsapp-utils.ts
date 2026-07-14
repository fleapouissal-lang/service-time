/** Utilitaires WhatsApp sans dépendance Node (client + serveur). */

export function normalizePhone(phone: string): string {
  const cleaned = phone.trim().replace(/[\s\-().]/g, "");

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  if (/^0[67]\d{8}$/.test(cleaned)) {
    return `+212${cleaned.slice(1)}`;
  }

  if (/^[67]\d{8}$/.test(cleaned)) {
    return `+212${cleaned}`;
  }

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

export function phoneToWhatsAppDigits(phone: string): string {
  return normalizePhone(phone).replace(/\D/g, "");
}

export function buildWaMeUrl(businessDigits: string, text: string): string {
  return `https://wa.me/${businessDigits}?text=${encodeURIComponent(text)}`;
}

export function getPublicWhatsAppDigits(): string {
  const raw =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
    process.env.WHATSAPP_NUMBER?.trim() ||
    "";
  if (!raw) return "966583814214";
  return phoneToWhatsAppDigits(raw);
}

export function buildWhatsAppQuickContactUrl(
  businessDigits: string,
  payload: {
    name?: string;
    phone?: string;
    message?: string;
  },
): string {
  const lines = [
    "مرحباً Service Time، أريد طلب خدمة سريع.",
    payload.name ? `الاسم: ${payload.name}` : null,
    payload.phone ? `الجوال: ${normalizePhone(payload.phone)}` : null,
    payload.message ? `الرسالة: ${payload.message}` : null,
  ].filter(Boolean);

  return buildWaMeUrl(businessDigits, lines.join("\n"));
}

export function buildWhatsAppSiteContactUrl(
  businessDigits: string,
  locale: "ar" | "en",
): string {
  const text =
    locale === "ar"
      ? "مرحباً Service Time، أريد الاستفسار عن خدماتكم."
      : "Hello Service Time, I would like to inquire about your services.";
  return buildWaMeUrl(businessDigits, text);
}

export function buildWhatsAppOrderTrackingToClientMessage(payload: {
  customerName: string;
  trackingToken: string;
  trackUrl: string;
}): string {
  return [
    `مرحباً ${payload.customerName}،`,
    "تم استلام طلبك في Service Time بنجاح.",
    `رمز التتبع: ${payload.trackingToken}`,
    `تتبع طلبك: ${payload.trackUrl}`,
  ].join("\n");
}

export function buildWhatsAppOrderCreatedToAdminMessage(payload: {
  customerName: string;
  customerPhone: string;
  serviceTypeLabel: string;
  trackingToken: string;
  trackUrl: string;
}): string {
  return [
    "طلب خدمة جديد — Service Time",
    `العميل: ${payload.customerName}`,
    `الجوال: ${normalizePhone(payload.customerPhone)}`,
    `نوع الخدمة: ${payload.serviceTypeLabel}`,
    `رمز التتبع: ${payload.trackingToken}`,
    `رابط التتبع: ${payload.trackUrl}`,
  ].join("\n");
}
