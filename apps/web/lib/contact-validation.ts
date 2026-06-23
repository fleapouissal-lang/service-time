import { normalizePhone, phoneToWhatsAppDigits } from "@/lib/whatsapp-utils";

const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export type ContactValidationError =
  | "email_required"
  | "email_invalid"
  | "phone_required"
  | "phone_invalid";

export function normalizeEmailInput(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmailInput(email);
  if (!normalized || normalized.length > 254) return false;
  if (!EMAIL_REGEX.test(normalized)) return false;

  const [local, domain] = normalized.split("@");
  if (!local || !domain || local.length > 64) return false;
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) {
    return false;
  }

  return true;
}

/** Numéros mobiles Maroc (+212 6/7) et Arabie saoudite (+966 5). */
export function isValidMobilePhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;

  const digits = phoneToWhatsAppDigits(normalizePhone(trimmed));
  return /^212[67]\d{8}$/.test(digits) || /^9665\d{8}$/.test(digits);
}

export function validateEmailField(
  email: string,
  options: { required?: boolean } = {},
): { ok: true; value: string } | { ok: false; error: ContactValidationError } {
  const trimmed = email.trim();
  const required = options.required !== false;

  if (!trimmed) {
    if (!required) return { ok: true, value: "" };
    return { ok: false, error: "email_required" };
  }

  const value = normalizeEmailInput(trimmed);
  if (!isValidEmail(value)) {
    return { ok: false, error: "email_invalid" };
  }

  return { ok: true, value };
}

export function validatePhoneField(
  phone: string,
  options: { required?: boolean } = {},
): { ok: true; value: string } | { ok: false; error: ContactValidationError } {
  const trimmed = phone.trim();
  const required = options.required !== false;

  if (!trimmed) {
    if (!required) return { ok: true, value: "" };
    return { ok: false, error: "phone_required" };
  }

  if (!isValidMobilePhone(trimmed)) {
    return { ok: false, error: "phone_invalid" };
  }

  return { ok: true, value: normalizePhone(trimmed) };
}

export function validateRequiredContact(
  email: string,
  phone: string,
): {
  ok: true;
  email: string;
  phone: string;
} | {
  ok: false;
  error: ContactValidationError;
} {
  const emailResult = validateEmailField(email, { required: true });
  if (!emailResult.ok) {
    return emailResult;
  }

  const phoneResult = validatePhoneField(phone, { required: true });
  if (!phoneResult.ok) {
    return phoneResult;
  }

  return {
    ok: true,
    email: emailResult.value,
    phone: phoneResult.value,
  };
}

export type ContactValidationMessages = {
  emailRequired: string;
  invalidEmail: string;
  phoneRequired: string;
  invalidPhone: string;
};

export function contactValidationErrorMessage(
  error: ContactValidationError,
  messages: ContactValidationMessages,
): string {
  switch (error) {
    case "email_required":
      return messages.emailRequired;
    case "email_invalid":
      return messages.invalidEmail;
    case "phone_required":
      return messages.phoneRequired;
    case "phone_invalid":
      return messages.invalidPhone;
  }
}

/** Messages serveur par défaut (arabe) lorsque le dictionnaire i18n n'est pas disponible. */
export const CONTACT_VALIDATION_AR: ContactValidationMessages = {
  emailRequired: "البريد الإلكتروني مطلوب.",
  invalidEmail: "البريد الإلكتروني غير صالح.",
  phoneRequired: "رقم الجوال مطلوب.",
  invalidPhone: "أدخل رقم جوال صالح (مثال: 05XXXXXXXX أو 06XXXXXXXX).",
};

export function contactValidationErrorMessageAr(
  error: ContactValidationError,
): string {
  return contactValidationErrorMessage(error, CONTACT_VALIDATION_AR);
}
