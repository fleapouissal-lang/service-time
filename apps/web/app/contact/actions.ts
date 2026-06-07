"use server";

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
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !phone || !message) {
    return { error: "الاسم ورقم الجوال والرسالة مطلوبة" };
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "البريد الإلكتروني غير صالح" };
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
    return { error: "إعدادات الخادم غير مكتملة." };
  }

  console.error("[contact] email failed:", mail.error);
  return {
    error:
      "تعذّر إرسال الرسالة. تأكد من جدول contact_messages في Supabase وإعدادات Gmail.",
  };
}
