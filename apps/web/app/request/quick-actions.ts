"use server";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { ensureServerEnv } from "@/lib/env-server";
import {
  getLoginUrl,
  resolveQuickRequestClient,
} from "@/lib/quick-request-client";
import { buildQuickRequestWelcomeWhatsAppMessage } from "@/lib/quick-request-welcome";
import {
  sendQuickRequestAdminNotification,
  sendQuickRequestWelcomeEmail,
} from "@/lib/send-email";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { uploadQuickRequestPhoto } from "@/lib/upload-quick-request-photo";
import {
  formHasPhotoField,
  getPhotoFromFormData,
} from "@/lib/upload-request-photo";
import { normalizePhone } from "@/lib/whatsapp-utils";
import { sendWhatsAppMessage } from "@/lib/whatsapp-send";

export interface QuickRequestFormState {
  error?: string;
  success?: boolean;
  accountCreated?: boolean;
}

export async function submitQuickServiceRequest(
  _prev: QuickRequestFormState,
  formData: FormData,
): Promise<QuickRequestFormState> {
  const t = getDictionary(await getLocale());
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const photo = getPhotoFromFormData(formData);
  const hadPhotoField = formHasPhotoField(formData);

  if (!name || !phone || !message) {
    return { error: t.errors.contact.requiredFields };
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: t.errors.contact.invalidEmail };
  }

  if (hadPhotoField && !photo) {
    return { error: t.errors.request.photoReadFailed };
  }

  ensureServerEnv();

  const admin = getAdminSupabaseClient();
  if (!admin) {
    return { error: t.errors.contact.serverIncomplete };
  }

  const clientResolution = await resolveQuickRequestClient({
    fullName: name,
    phone,
    email: email || null,
  });

  if (!clientResolution.ok) {
    const code = clientResolution.error;
    if (code === "email_used_non_client") {
      return { error: t.errors.request.quickEmailUsed };
    }
    if (code === "create_user_failed" || code === "create_profile_failed") {
      return { error: t.errors.request.quickAccountFailed };
    }
    return { error: t.errors.contact.sendFailed };
  }

  const { clientId, createdNew, generatedPassword, loginEmail, notifiedEmail } =
    clientResolution.result;

  const { data: row, error: insertError } = await admin
    .from("quick_requests")
    .insert({
      name,
      phone: normalizePhone(phone),
      email: email || null,
      message,
      client_id: clientId,
    })
    .select("id")
    .single();

  if (insertError || !row) {
    if (createdNew) {
      await admin.auth.admin.deleteUser(clientId).catch(() => undefined);
    }
    const missingTable =
      insertError?.code === "PGRST205" ||
      insertError?.message?.includes("quick_requests");
    return {
      error: missingTable
        ? t.errors.request.quickDbMissing
        : t.errors.contact.sendFailed,
    };
  }

  let photoStoragePath: string | null = null;

  if (photo) {
    const upload = await uploadQuickRequestPhoto(row.id, photo);
    if ("error" in upload) {
      await admin.from("quick_requests").delete().eq("id", row.id);
      return { error: upload.error };
    }

    photoStoragePath = upload.storagePath;
    const { error: updateError } = await admin
      .from("quick_requests")
      .update({ photo_storage_path: photoStoragePath })
      .eq("id", row.id);

    if (updateError) {
      await admin.from("quick_requests").delete().eq("id", row.id);
      return { error: t.errors.contact.sendFailed };
    }
  }

  if (createdNew && generatedPassword) {
    const loginUrl = getLoginUrl();
    const welcomePayload = {
      fullName: name,
      loginEmail,
      password: generatedPassword,
      loginUrl,
      phone: normalizePhone(phone),
    };

    if (notifiedEmail) {
      const welcomeMail = await sendQuickRequestWelcomeEmail(welcomePayload);
      if (!welcomeMail.ok) {
        console.error("[quick-request] welcome email:", welcomeMail.error);
      }
    }

    const waText = buildQuickRequestWelcomeWhatsAppMessage(welcomePayload);
    const waResult = await sendWhatsAppMessage(phone, waText);
    if (!waResult.ok) {
      console.error("[quick-request] welcome whatsapp:", waResult.error);
    }
  }

  const mail = await sendQuickRequestAdminNotification({
    name,
    phone: normalizePhone(phone),
    email: email || null,
    message,
    hasPhoto: Boolean(photoStoragePath),
  });

  if (!mail.ok) {
    console.error("[quick-request] admin email:", mail.error);
  }

  return {
    success: true,
    accountCreated: createdNew,
  };
}
