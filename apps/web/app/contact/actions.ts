"use server";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { ensureServerEnv } from "@/lib/env-server";
import { sendContactNotification } from "@/lib/send-email";

export interface ContactFormState {
  error?: string;
  success?: boolean;
}

export async function submitContactMessage(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const t = getDictionary(await getLocale());
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

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
