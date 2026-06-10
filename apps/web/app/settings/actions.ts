"use server";

import type { Profile } from "@service-time/types";
import { revalidatePath } from "next/cache";
import { createAuthServerClient, getCurrentProfile } from "@/lib/auth";
import { verifyUserPassword } from "@/lib/verify-user-password";
import {
  contactValidationErrorMessage,
  validateEmailField,
  validatePhoneField,
} from "@/lib/contact-validation";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { isStrongEnoughPassword } from "@/lib/password-policy";
import { getProfileHomePath } from "@/lib/profile-home";
import {
  applyProfileContactPayload,
  confirmProfileContactVerification,
  emailsEqual,
  initiateProfileContactVerification,
  phonesEqual,
} from "@/lib/profile-contact-verification";
import { resolveProfileNamesFromFields } from "@/lib/profile-names";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import {
  getAvatarFromFormData,
  uploadProfileAvatar,
} from "@/lib/upload-profile-avatar";

export type ProfileSettingsFormState = {
  success?: boolean;
  error?: string;
  verificationRequired?: {
    verificationId: string;
    emailChanged: boolean;
    phoneChanged: boolean;
  };
};

export type PasswordSettingsFormState = {
  success?: boolean;
  error?: string;
};

function revalidateSettingsPaths(role: Profile["role"]) {
  const base = getProfileHomePath(role);
  revalidatePath(base);
  revalidatePath(`${base}/settings`);
  if (role === "client") {
    revalidatePath("/client/profile");
  }
}

function mapProfileContactError(
  code: string,
  s: ReturnType<typeof getDictionary>["dashboard"]["settings"],
): string {
  switch (code) {
    case "PROFILE_CONTACT_EMAIL_IN_USE":
      return s.emailInUse;
    case "PROFILE_CONTACT_PHONE_VERIFY_UNAVAILABLE":
      return s.phoneVerifyUnavailable;
    case "PROFILE_CONTACT_VERIFY_START_FAILED":
      return s.contactVerifyStartFailed;
    case "PROFILE_CONTACT_EMAIL_SEND_FAILED":
      return s.contactEmailSendFailed;
    case "PROFILE_CONTACT_WHATSAPP_SEND_FAILED":
      return s.contactWhatsAppSendFailed;
    case "PROFILE_CONTACT_VERIFY_EXPIRED":
      return s.contactVerifyExpired;
    case "PROFILE_CONTACT_EMAIL_CODE_INVALID":
      return s.emailVerificationCodeInvalid;
    case "PROFILE_CONTACT_EMAIL_CODE_WRONG":
      return s.emailVerificationCodeWrong;
    case "PROFILE_CONTACT_EMAIL_ATTEMPTS":
      return s.emailVerificationAttempts;
    case "PROFILE_CONTACT_PHONE_CODE_INVALID":
      return s.phoneVerificationCodeInvalid;
    case "PROFILE_CONTACT_PHONE_CODE_WRONG":
      return s.phoneVerificationCodeWrong;
    case "PROFILE_CONTACT_PHONE_ATTEMPTS":
      return s.phoneVerificationAttempts;
    default:
      return code;
  }
}

async function applyDirectProfileSettingsUpdate(
  profile: Profile,
  params: {
    fullNameAr: string;
    fullNameEn: string;
    phone: string;
    avatarUrl: string | null;
  },
): Promise<ProfileSettingsFormState> {
  const supabase = await createAuthServerClient();
  const localizedNames = await resolveProfileNamesFromFields(
    params.fullNameAr,
    params.fullNameEn,
  );

  const profileUpdate: Record<string, unknown> = {
    full_name: localizedNames.full_name,
    full_name_ar: localizedNames.full_name_ar,
    full_name_en: localizedNames.full_name_en,
    phone: params.phone,
  };

  if (params.avatarUrl) {
    profileUpdate.avatar_url = params.avatarUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", profile.id);

  if (error) {
    return { error: error.message };
  }

  const admin = getAdminSupabaseClient();
  if (admin) {
    await admin.auth.admin.updateUserById(profile.id, {
      user_metadata: {
        full_name: localizedNames.full_name,
        full_name_ar: localizedNames.full_name_ar,
        full_name_en: localizedNames.full_name_en,
        phone: params.phone,
      },
    });
  }

  revalidateSettingsPaths(profile.role);
  return { success: true };
}

export async function updateProfileSettingsAction(
  _prev: ProfileSettingsFormState,
  formData: FormData,
): Promise<ProfileSettingsFormState> {
  const t = getDictionary(await getLocale());
  const s = t.dashboard.settings;
  const contactMessages = {
    emailRequired: t.errors.contact.emailRequired,
    invalidEmail: t.errors.contact.invalidEmail,
    phoneRequired: t.errors.contact.phoneRequired,
    invalidPhone: t.errors.contact.invalidPhone,
  };
  const profile = await getCurrentProfile();

  if (!profile?.is_active) {
    return { error: s.notAuthenticated };
  }

  const full_name_ar = String(formData.get("full_name_ar") ?? "").trim();
  const full_name_en = String(formData.get("full_name_en") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const verificationId = String(formData.get("verification_id") ?? "").trim();
  const emailCode = String(formData.get("email_verification_code") ?? "").trim();
  const phoneCode = String(formData.get("phone_verification_code") ?? "").trim();

  if (full_name_ar.length < 2) {
    return { error: s.nameArRequired };
  }

  if (full_name_en.length < 2) {
    return { error: s.nameEnRequired };
  }

  const emailResult = validateEmailField(emailRaw, { required: true });
  if (!emailResult.ok) {
    return {
      error: contactValidationErrorMessage(emailResult.error, contactMessages),
    };
  }

  const phoneResult = validatePhoneField(phoneRaw, { required: true });
  if (!phoneResult.ok) {
    return {
      error: contactValidationErrorMessage(phoneResult.error, contactMessages),
    };
  }

  const newEmail = emailResult.value;
  const newPhone = phoneResult.value;

  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: s.notAuthenticated };
  }

  const oldEmail = user.email ?? "";
  const oldPhone = profile.phone;
  const emailChanged = !emailsEqual(oldEmail, newEmail);
  const phoneChanged = !phonesEqual(oldPhone, newPhone);

  let avatar_url = profile.avatar_url;
  const avatarFile = getAvatarFromFormData(formData);

  if (avatarFile) {
    const uploaded = await uploadProfileAvatar(profile.id, avatarFile);
    if ("error" in uploaded) {
      return { error: uploaded.error };
    }
    avatar_url = uploaded.publicUrl;
  }

  const admin = getAdminSupabaseClient();
  if (!admin) {
    return { error: s.serverIncomplete };
  }

  if (verificationId) {
    try {
      const payload = await confirmProfileContactVerification(admin, {
        userId: profile.id,
        verificationId,
        emailCode,
        phoneCode,
      });

      await applyProfileContactPayload(admin, profile.id, payload, oldEmail);
      revalidateSettingsPaths(profile.role);
      return { success: true };
    } catch (err) {
      const message =
        err instanceof Error
          ? mapProfileContactError(err.message, s)
          : s.contactVerifyStartFailed;
      return { error: message };
    }
  }

  if (!emailChanged && !phoneChanged) {
    return applyDirectProfileSettingsUpdate(profile, {
      fullNameAr: full_name_ar,
      fullNameEn: full_name_en,
      phone: newPhone,
      avatarUrl: avatar_url,
    });
  }

  try {
    const started = await initiateProfileContactVerification(admin, {
      userId: profile.id,
      fullNameAr: full_name_ar,
      fullNameEn: full_name_en,
      oldEmail,
      oldPhone,
      newEmail,
      newPhone,
      emailChanged,
      phoneChanged,
      avatarUrl: avatar_url,
    });

    return {
      verificationRequired: {
        verificationId: started.verificationId,
        emailChanged: started.emailChanged,
        phoneChanged: started.phoneChanged,
      },
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? mapProfileContactError(err.message, s)
        : s.contactVerifyStartFailed;
    return { error: message };
  }
}

export async function changePasswordSettingsAction(
  _prev: PasswordSettingsFormState,
  formData: FormData,
): Promise<PasswordSettingsFormState> {
  try {
    const t = getDictionary(await getLocale());
    const s = t.dashboard.settings;
    const profile = await getCurrentProfile();

    if (!profile?.is_active) {
      return { error: s.notAuthenticated };
    }

    const currentPassword = String(formData.get("current_password") ?? "");
    const newPassword = String(formData.get("new_password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (!currentPassword) {
      return { error: s.currentPasswordRequired };
    }

    if (!isStrongEnoughPassword(newPassword)) {
      return { error: s.passwordTooShort };
    }

    if (newPassword !== confirmPassword) {
      return { error: s.passwordMismatch };
    }

    if (currentPassword === newPassword) {
      return { error: s.passwordSameAsCurrent };
    }

    const supabase = await createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return { error: s.emailMissing };
    }

    const passwordOk = await verifyUserPassword(user.email, currentPassword);
    if (!passwordOk) {
      return { error: s.wrongCurrentPassword };
    }

    const admin = getAdminSupabaseClient();
    if (!admin) {
      return { error: s.serverIncomplete };
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(
      user.id,
      { password: newPassword },
    );

    if (updateError) {
      console.error("[settings/changePassword]", updateError);
      return { error: s.passwordUpdateFailed };
    }

    return { success: true };
  } catch (err) {
    console.error("[settings/changePassword] unexpected:", err);
    const t = getDictionary(await getLocale());
    return { error: t.dashboard.settings.passwordUpdateFailed };
  }
}
