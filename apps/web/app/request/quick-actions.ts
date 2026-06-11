"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth";
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
import { uploadQuickRequestPhoto, isQuickRequestPhotoBucketMissingError } from "@/lib/upload-quick-request-photo";
import {
  formHasPhotoField,
  getPhotoFromFormData,
} from "@/lib/upload-request-photo";
import {
  FIELD_LIMITS,
  checkPublicFormGuard,
  clampField,
  resolveFormGuardError,
} from "@/lib/form-security";
import {
  contactValidationErrorMessage,
  validateQuickRequestContact,
} from "@/lib/contact-validation";

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
  const profile = await getCurrentProfile();
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

  const contact = validateQuickRequestContact(phone, email);
  if (!contact.ok) {
    return {
      error: contactValidationErrorMessage(contact.error, {
        emailRequired: t.errors.contact.emailRequired,
        invalidEmail: t.errors.contact.invalidEmail,
        phoneRequired: t.errors.contact.phoneRequired,
        invalidPhone: t.errors.contact.invalidPhone,
      }),
    };
  }

  const validatedEmail = contact.email || null;
  const validatedPhone = contact.phone;

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
    phone: validatedPhone,
    email: validatedEmail,
    preferredClientId:
      profile?.is_active && profile.role === "client" ? profile.id : null,
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
      phone: validatedPhone,
      email: validatedEmail,
      message,
      client_id: clientId,
    })
    .select("id")
    .single();

  if (insertError || !row) {
    if (createdNew) {
      await admin.auth.admin.deleteUser(clientId).catch(() => undefined);
    }
    console.error("[quick-request] insert:", insertError);
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
      if (createdNew) {
        await admin.auth.admin.deleteUser(clientId).catch(() => undefined);
      }
      if (isQuickRequestPhotoBucketMissingError(upload.error)) {
        console.error("[quick-request] photo bucket missing:", upload.error);
        return { error: t.errors.request.quickPhotoStorageMissing };
      }
      return { error: upload.error };
    } else {
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
  }

  if (createdNew && generatedPassword) {
    void notifyAccountCreated({
      fullName: name,
      loginEmail,
      phone: validatedPhone,
      password: generatedPassword,
      source: "quick_request",
      loginUrl: getLoginUrl(),
    }).catch((err) => console.error("[quick-request] welcome notify:", err));
  }

  const mail = await sendQuickRequestAdminNotification({
    name,
    phone: validatedPhone,
    email: validatedEmail,
    message,
    hasPhoto: Boolean(photoStoragePath),
  });

  if (!mail.ok) {
    console.error("[quick-request] admin email:", mail.error);
  } else if (mail.dev) {
    console.info(
      "[quick-request] admin notification skipped (CONTACT_NOTIFY_EMAIL / SMTP not configured)",
    );
  }

  revalidatePath("/admin/quick-requests");
  revalidatePath("/admin");
  revalidatePath("/client/quick-requests");
  revalidatePath("/client");

  return {
    success: true,
    accountCreated: createdNew,
  };
}
