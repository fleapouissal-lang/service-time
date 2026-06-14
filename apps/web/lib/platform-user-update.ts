import type { ProfileRole, TechnicianType } from "@service-time/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  contactValidationErrorMessageAr,
  validateEmailField,
  validatePhoneField,
} from "@/lib/contact-validation";
import { isStrongEnoughPassword, PASSWORD_REQUIREMENTS_AR } from "@/lib/password-policy";
import { resolveProfileNamesFromFields } from "@/lib/profile-names";
import {
  getAvatarFromFormData,
  uploadProfileAvatar,
} from "@/lib/upload-profile-avatar";

export type PlatformUserUpdateInput = {
  id: string;
  fullNameAr: string;
  fullNameEn: string;
  email: string;
  password: string;
  phone: string | null;
  role: ProfileRole;
  technicianType: TechnicianType | null;
  avatarFile: File | null;
};

export function parsePlatformUserUpdateInput(
  formData: FormData,
): PlatformUserUpdateInput {
  const role = String(formData.get("role") ?? "technician") as ProfileRole;
  const technicianTypeRaw = String(formData.get("technician_type") ?? "").trim();
  let technicianType: TechnicianType | null = null;

  if (role === "technician") {
    if (technicianTypeRaw !== "mobile" && technicianTypeRaw !== "workshop") {
      throw new Error("اختر نوع الفني.");
    }
    technicianType = technicianTypeRaw;
  }

  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const phoneResult = validatePhoneField(phoneRaw, { required: true });

  return {
    id: String(formData.get("id") ?? "").trim(),
    fullNameAr: String(formData.get("full_name_ar") ?? "").trim(),
    fullNameEn: String(formData.get("full_name_en") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? "").trim(),
    phone: phoneResult.ok ? phoneResult.value : null,
    role,
    technicianType,
    avatarFile: getAvatarFromFormData(formData),
  };
}

export function validatePlatformUserUpdateInput(input: PlatformUserUpdateInput) {
  if (!input.id) {
    throw new Error("معرّف المستخدم غير صالح.");
  }

  if (input.fullNameAr.length < 2) {
    throw new Error("أدخل الاسم بالعربية.");
  }

  if (input.fullNameEn.length < 2) {
    throw new Error("أدخل الاسم بالإنجليزية.");
  }

  const emailResult = validateEmailField(input.email, { required: true });
  if (!emailResult.ok) {
    throw new Error(contactValidationErrorMessageAr(emailResult.error));
  }

  const phoneResult = validatePhoneField(input.phone ?? "", { required: true });
  if (!phoneResult.ok) {
    throw new Error(contactValidationErrorMessageAr(phoneResult.error));
  }

  if (input.password && !isStrongEnoughPassword(input.password)) {
    throw new Error(PASSWORD_REQUIREMENTS_AR);
  }

  if (!["client", "technician", "admin"].includes(input.role)) {
    throw new Error("نوع الحساب غير صالح.");
  }
}

export async function applyPlatformUserUpdate(
  admin: SupabaseClient,
  input: PlatformUserUpdateInput,
): Promise<void> {
  const emailResult = validateEmailField(input.email, { required: true });
  const phoneResult = validatePhoneField(input.phone ?? "", { required: true });
  if (!emailResult.ok) {
    throw new Error(contactValidationErrorMessageAr(emailResult.error));
  }
  if (!phoneResult.ok) {
    throw new Error(contactValidationErrorMessageAr(phoneResult.error));
  }

  const email = emailResult.value;
  const phone = phoneResult.value;

  const localizedNames = await resolveProfileNamesFromFields(
    input.fullNameAr,
    input.fullNameEn,
  );

  const authUpdate: {
    email: string;
    password?: string;
    user_metadata: Record<string, unknown>;
  } = {
    email,
    user_metadata: {
      full_name: localizedNames.full_name,
      full_name_ar: localizedNames.full_name_ar,
      full_name_en: localizedNames.full_name_en,
      phone,
    },
  };

  if (input.password) {
    authUpdate.password = input.password;
  }

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(
    input.id,
    authUpdate,
  );

  if (authUpdateError) {
    throw new Error(authUpdateError.message);
  }

  let avatarUrl: string | undefined;
  let avatarStoragePath: string | undefined;
  if (input.avatarFile) {
    const uploaded = await uploadProfileAvatar(input.id, input.avatarFile);
    if ("error" in uploaded) {
      throw new Error(uploaded.error);
    }
    avatarUrl = uploaded.publicUrl;
    avatarStoragePath = uploaded.storagePath;
  }

  const profilePayload: Record<string, unknown> = {
    full_name: localizedNames.full_name,
    full_name_ar: localizedNames.full_name_ar,
    full_name_en: localizedNames.full_name_en,
    phone,
    role: input.role,
    technician_type: input.technicianType,
  };

  if (avatarUrl) {
    profilePayload.avatar_url = avatarUrl;
    profilePayload.avatar_storage_path = avatarStoragePath;
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update(profilePayload)
    .eq("id", input.id);

  if (profileError) {
    throw new Error(profileError.message);
  }
}
