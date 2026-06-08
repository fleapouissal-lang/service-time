"use server";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { ensureServerEnv } from "@/lib/env-server";
import { sendContactNotification } from "@/lib/send-email";
import {
  FIELD_LIMITS,
  checkPublicFormGuard,
  clampField,
  resolveFormGuardError,
} from "@/lib/form-security";

export interface ContactFormState {
  error?: string;
  success?: boolean;
}

export async function submitContactMessage(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const t = getDictionary(await getLocale());
  const guard = await checkPublicFormGuard(formData, "contact");

  if (!guard.allowed) {
    if (guard.honeypot) return { success: true };
    const message = resolveFormGuardError(guard, t.errors.forms);
    return { error: message ?? t.errors.forms.invalidSubmission };
  }

  const name = clampField(String(formData.get("name") ?? ""), FIELD_LIMITS.name);
  const phone = clampField(String(formData.get("phone") ?? ""), FIELD_LIMITS.phone);
  const email = clampField(String(formData.get("email") ?? ""), FIELD_LIMITS.email);
  const message = clampField(
    String(formData.get("message") ?? ""),
    FIELD_LIMITS.message,
  );

  if (!name || !phone || !message) {
    return { error: t.errors.contact.requiredFields };
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: t.errors.contact.invalidEmail };
  }

  ensureServerEnv();

  const payload = {
    name,
    phone,
    email: email || null,
    message,
  };

  let savedToDb = false;
  const admin = getAdminSupabaseClient();

  if (admin) {
    const { error } = await admin.from("contact_messages").insert(payload);

    if (!error) {
      savedToDb = true;
    } else {
      const missingTable =
        error.code === "PGRST205" ||
        error.message?.includes("contact_messages");
      if (!missingTable) {
        console.error("[contact] db insert:", error);
      }
    }
  }

  const mail = await sendContactNotification(payload);

  if (mail.ok) {
    return { success: true };
  }

  if (savedToDb) {
    return { success: true };
  }

  if (!admin) {
    return { error: t.errors.contact.serverIncomplete };
  }

  console.error("[contact] email failed:", mail.error);
  return {
    error: t.errors.contact.sendFailed,
  };
}
