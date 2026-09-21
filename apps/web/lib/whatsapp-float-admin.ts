import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import type {
  AdminWhatsAppFloatSettings,
  PublicWhatsAppFloatSettings,
} from "@/lib/whatsapp-float-shared";
import {
  buildWaMeUrl,
  getPublicWhatsAppDigits,
  normalizePhone,
  phoneToWhatsAppDigits,
} from "@/lib/whatsapp-utils";

export type {
  AdminWhatsAppFloatSettings,
  PublicWhatsAppFloatSettings,
} from "@/lib/whatsapp-float-shared";

export const WHATSAPP_FLOAT_SITE_CONTENT_KEY = "site.whatsapp_float";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asBool(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (value === "on" || value === "true" || value === 1 || value === "1") {
    return true;
  }
  if (value === "off" || value === "false" || value === 0 || value === "0") {
    return false;
  }
  return fallback;
}

export function buildDefaultWhatsAppFloatSettings(): AdminWhatsAppFloatSettings {
  const digits = getPublicWhatsAppDigits();
  return {
    is_active: true,
    phone: digits ? `+${digits}` : "+966583814214",
    custom_url: "",
    message_ar: "مرحباً Service Time، أريد الاستفسار عن خدماتكم.",
    message_en: "Hello Service Time, I would like to inquire about your services.",
  };
}

function normalizeSettings(raw: unknown): AdminWhatsAppFloatSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const defaults = buildDefaultWhatsAppFloatSettings();
  return {
    is_active: asBool(row.is_active, defaults.is_active),
    phone: asString(row.phone) || defaults.phone,
    custom_url: asString(row.custom_url),
    message_ar: asString(row.message_ar) || defaults.message_ar,
    message_en: asString(row.message_en) || defaults.message_en,
  };
}

export async function getAdminWhatsAppFloatSettings(): Promise<AdminWhatsAppFloatSettings> {
  const admin = getAdminSupabaseClient();
  if (!admin) return buildDefaultWhatsAppFloatSettings();

  const { data, error } = await admin
    .from("site_content")
    .select("value")
    .eq("key", WHATSAPP_FLOAT_SITE_CONTENT_KEY)
    .maybeSingle();

  if (error || !data?.value) return buildDefaultWhatsAppFloatSettings();
  return normalizeSettings(data.value) ?? buildDefaultWhatsAppFloatSettings();
}

export async function persistWhatsAppFloatSettings(
  supabase: SupabaseClient,
  settings: AdminWhatsAppFloatSettings,
): Promise<void> {
  const { error } = await supabase.from("site_content").upsert({
    key: WHATSAPP_FLOAT_SITE_CONTENT_KEY,
    value: settings,
  });
  if (error) throw new Error(error.message);
}

export function resolveWhatsAppFloatHref(
  settings: AdminWhatsAppFloatSettings,
  locale: "ar" | "en",
): string {
  const custom = settings.custom_url.trim();
  if (custom) {
    if (/^https?:\/\//i.test(custom)) return custom;
    if (custom.startsWith("wa.me/") || custom.startsWith("api.whatsapp.com/")) {
      return `https://${custom}`;
    }
    const digits = phoneToWhatsAppDigits(custom);
    if (digits) {
      const text =
        locale === "en" ? settings.message_en : settings.message_ar;
      return buildWaMeUrl(digits, text);
    }
  }

  const digits = phoneToWhatsAppDigits(settings.phone || getPublicWhatsAppDigits());
  const text = locale === "en" ? settings.message_en : settings.message_ar;
  return buildWaMeUrl(digits, text);
}

export function toPublicWhatsAppFloatSettings(
  settings: AdminWhatsAppFloatSettings,
  locale: "ar" | "en",
): PublicWhatsAppFloatSettings {
  return {
    isActive: settings.is_active,
    href: resolveWhatsAppFloatHref(settings, locale),
  };
}

export async function getPublicWhatsAppFloatSettings(
  locale: "ar" | "en",
): Promise<PublicWhatsAppFloatSettings> {
  const settings = await getAdminWhatsAppFloatSettings();
  return toPublicWhatsAppFloatSettings(settings, locale);
}

export function parseWhatsAppFloatFromForm(
  formData: FormData,
): AdminWhatsAppFloatSettings {
  return {
    is_active: formData.get("is_active") === "on",
    phone: String(formData.get("phone") ?? "").trim(),
    custom_url: String(formData.get("custom_url") ?? "").trim(),
    message_ar: String(formData.get("message_ar") ?? "").trim(),
    message_en: String(formData.get("message_en") ?? "").trim(),
  };
}

export function validateWhatsAppFloatSettings(
  settings: AdminWhatsAppFloatSettings,
): string | null {
  if (settings.custom_url) {
    const url = settings.custom_url.trim();
    const looksLikeUrl =
      /^https?:\/\//i.test(url) ||
      url.startsWith("wa.me/") ||
      url.startsWith("api.whatsapp.com/") ||
      phoneToWhatsAppDigits(url).length >= 8;
    if (!looksLikeUrl) return "url_invalid";
    return null;
  }

  const digits = phoneToWhatsAppDigits(normalizePhone(settings.phone));
  if (digits.length < 8) return "phone_invalid";
  return null;
}
