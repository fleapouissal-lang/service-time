"use server";

import type { Profile } from "@service-time/types";
import { revalidatePath } from "next/cache";
import { createAuthServerClient, getCurrentProfile } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { isStrongEnoughPassword } from "@/lib/password-reset";
import { getProfileHomePath } from "@/lib/profile-home";
import { resolveProfileNamesFromFields } from "@/lib/profile-names";
import {
  getAvatarFromFormData,
  uploadProfileAvatar,
} from "@/lib/upload-profile-avatar";

export type ProfileSettingsFormState = {
  success?: boolean;
  error?: string;
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

export async function updateProfileSettingsAction(
  _prev: ProfileSettingsFormState,
  formData: FormData,
): Promise<ProfileSettingsFormState> {
  const t = getDictionary(await getLocale());
  const s = t.dashboard.settings;
  const profile = await getCurrentProfile();

  if (!profile?.is_active) {
    return { error: s.notAuthenticated };
  }

  const full_name_ar = String(formData.get("full_name_ar") ?? "").trim();
  const full_name_en = String(formData.get("full_name_en") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (full_name_ar.length < 2) {
    return { error: s.nameArRequired };
  }

  if (full_name_en.length < 2) {
    return { error: s.nameEnRequired };
  }

  const supabase = await createAuthServerClient();
  let avatar_url = profile.avatar_url;
  const avatarFile = getAvatarFromFormData(formData);

  if (avatarFile) {
    const uploaded = await uploadProfileAvatar(profile.id, avatarFile);
    if ("error" in uploaded) {
      return { error: uploaded.error };
    }
    avatar_url = uploaded.publicUrl;
  }

  const localizedNames = await resolveProfileNamesFromFields(
    full_name_ar,
    full_name_en,
  );

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: localizedNames.full_name,
      full_name_ar: localizedNames.full_name_ar,
      full_name_en: localizedNames.full_name_en,
      phone: phone || null,
      avatar_url,
    })
    .eq("id", profile.id);

  if (error) {
    return { error: error.message };
  }

  revalidateSettingsPaths(profile.role);
  return { success: true };
}

export async function changePasswordSettingsAction(
  _prev: PasswordSettingsFormState,
  formData: FormData,
): Promise<PasswordSettingsFormState> {
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

  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: s.emailMissing };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { error: s.wrongCurrentPassword };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { error: s.passwordUpdateFailed };
  }

  return { success: true };
}
