import { ensureServerEnv } from "@/lib/env-server";
import { normalizePhone, phoneToWhatsAppDigits } from "@/lib/whatsapp-utils";

export type WhatsAppSendResult =
  | { ok: true; dev?: boolean; waUrl?: string }
  | { ok: false; error: string; waUrl?: string };

function getWhatsAppApiConfig() {
  ensureServerEnv();
  return {
    token: process.env.WHATSAPP_ACCESS_TOKEN?.trim() ?? "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? "",
  };
}

export function buildWhatsAppUrl(toPhone: string, text: string): string {
  return `https://wa.me/${phoneToWhatsAppDigits(toPhone)}?text=${encodeURIComponent(text)}`;
}

/** Envoi WhatsApp via Meta Cloud API (optionnel) ou lien wa.me en secours. */
export async function sendWhatsAppMessage(
  toPhone: string,
  text: string,
): Promise<WhatsAppSendResult> {
  ensureServerEnv();

  const waUrl = buildWhatsAppUrl(toPhone, text);
  const { token, phoneNumberId } = getWhatsAppApiConfig();

  if (!token || !phoneNumberId) {
    console.info(`[whatsapp] Dev mode — message to ${normalizePhone(toPhone)}:\n${text}`);
    return { ok: true, dev: true, waUrl };
  }

  const to = phoneToWhatsAppDigits(toPhone);
  if (!to) {
    return { ok: false, error: "رقم واتساب غير صالح.", waUrl };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text },
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      console.error("[whatsapp] API error:", body);
      return {
        ok: false,
        error: "تعذّر إرسال رسالة واتساب.",
        waUrl,
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("[whatsapp] send failed:", error);
    return { ok: false, error: "تعذّر إرسال رسالة واتساب.", waUrl };
  }
}