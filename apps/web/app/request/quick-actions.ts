"use server";

import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { ensureServerEnv } from "@/lib/env-server";
import {
  getLoginUrl,
  resolveQuickRequestClient,
} from "@/lib/quick-request-client";
import { notifyAccountCreated } from "@/lib/account-welcome-notifications";
import { sendQuickRequestAdminNotification } from "@/lib/send-email";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { uploadQuickRequestPhoto } from "@/lib/upload-quick-request-photo";
import {
  formHasPhotoField,
  getPhotoFromFormData,
} from "@/lib/upload-request-photo";
import { normalizePhone } from "@/lib/whatsapp-utils";
import {
  FIELD_LIMITS,
  checkPublicFormGuard,
  clampField,
  resolveFormGuardError,
} from "@/lib/form-security";

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
  const guard = await checkPublicFormGuard(formData, "quickRequest");

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

  const { clientId, createdNew, generatedPassword, loginEmail } =
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
    void notifyAccountCreated({
      fullName: name,
      loginEmail,
      phone: normalizePhone(phone),
      password: generatedPassword,
      source: "quick_request",
      loginUrl: getLoginUrl(),
    }).catch((err) => console.error("[quick-request] welcome notify:", err));
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
