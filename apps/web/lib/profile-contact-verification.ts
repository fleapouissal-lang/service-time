import type { SupabaseClient } from "@supabase/supabase-js";
import { findAuthUserByEmail } from "@/lib/auth-users";
import { resolveProfileNamesFromFields } from "@/lib/profile-names";
import {
  buildPhoneContactVerifyWhatsAppMessage,
  CONTACT_VERIFY_MAX_ATTEMPTS,
  CONTACT_VERIFY_TTL_MS,
  emailsEqual,
  generateContactVerifyCode,
  hashContactVerifyCode,
  isValidContactVerifyCode,
  phonesEqual,
} from "@/lib/platform-user-contact-verification";
import { sendContactChangeVerificationCode } from "@/lib/send-email";
import { sendWhatsAppMessage } from "@/lib/whatsapp-send";

export type ProfileContactVerificationPayload = {
  full_name_ar: string;
  full_name_en: string;
  email: string;
  phone: string;
  avatar_url: string | null;
};

type ProfileContactVerificationRow = {
  id: string;
  user_id: string;
  payload: ProfileContactVerificationPayload;
  new_email: string | null;
  new_phone: string | null;
  old_email: string | null;
  old_phone: string | null;
  email_code_hash: string | null;
  phone_code_hash: string | null;
  email_attempts: number;
  phone_attempts: number;
  expires_at: string;
};

export type ProfileContactVerificationStart = {
  verificationId: string;
  emailChanged: boolean;
  phoneChanged: boolean;
};

function logDevCodes(payload: {
  userId: string;
  emailCode: string | null;
  phoneCode: string | null;
  phoneTarget: string | null;
}) {
  if (process.env.NODE_ENV !== "production") {
    console.info("[profile-contact-verify]", payload);
  }
}

export async function initiateProfileContactVerification(
  admin: SupabaseClient,
  params: {
    userId: string;
    fullNameAr: string;
    fullNameEn: string;
    oldEmail: string;
    oldPhone: string | null;
    newEmail: string;
    newPhone: string;
    emailChanged: boolean;
    phoneChanged: boolean;
    avatarUrl: string | null;
  },
): Promise<ProfileContactVerificationStart> {
  const emailVerifyCode = params.emailChanged ? generateContactVerifyCode() : null;
  const phoneVerifyCode = params.phoneChanged ? generateContactVerifyCode() : null;
  const phoneVerifyTarget = params.phoneChanged
    ? (params.newPhone ?? params.oldPhone)
    : null;

  if (params.phoneChanged && !phoneVerifyTarget) {
    throw new Error("PROFILE_CONTACT_PHONE_VERIFY_UNAVAILABLE");
  }

  if (params.emailChanged) {
    const existing = await findAuthUserByEmail(params.newEmail);
    if (existing && existing.id !== params.userId) {
      throw new Error("PROFILE_CONTACT_EMAIL_IN_USE");
    }
  }

  const payload: ProfileContactVerificationPayload = {
    full_name_ar: params.fullNameAr,
    full_name_en: params.fullNameEn,
    email: params.newEmail,
    phone: params.newPhone,
    avatar_url: params.avatarUrl,
  };

  await admin
    .from("profile_contact_verifications")
    .delete()
    .eq("user_id", params.userId);

  const { data: row, error: insertError } = await admin
    .from("profile_contact_verifications")
    .insert({
      user_id: params.userId,
      payload,
      new_email: params.emailChanged ? params.newEmail : null,
      new_phone: params.phoneChanged ? params.newPhone : null,
      old_email: params.oldEmail,
      old_phone: params.oldPhone,
      email_code_hash: emailVerifyCode
        ? hashContactVerifyCode("email", params.newEmail, emailVerifyCode)
        : null,
      phone_code_hash:
        phoneVerifyCode && phoneVerifyTarget
          ? hashContactVerifyCode("phone", phoneVerifyTarget, phoneVerifyCode)
          : null,
      expires_at: new Date(Date.now() + CONTACT_VERIFY_TTL_MS).toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !row) {
    throw new Error(insertError?.message ?? "PROFILE_CONTACT_VERIFY_START_FAILED");
  }

  if (params.emailChanged && emailVerifyCode) {
    const mail = await sendContactChangeVerificationCode(
      params.newEmail,
      emailVerifyCode,
      params.fullNameAr,
    );
    if (!mail.ok) {
      await admin.from("profile_contact_verifications").delete().eq("id", row.id);
      throw new Error(mail.error ?? "PROFILE_CONTACT_EMAIL_SEND_FAILED");
    }
  }

  if (params.phoneChanged && phoneVerifyCode && phoneVerifyTarget) {
    const wa = await sendWhatsAppMessage(
      phoneVerifyTarget,
      buildPhoneContactVerifyWhatsAppMessage({
        fullName: params.fullNameAr,
        code: phoneVerifyCode,
      }),
    );
    if (!wa.ok) {
      await admin.from("profile_contact_verifications").delete().eq("id", row.id);
      throw new Error(wa.error ?? "PROFILE_CONTACT_WHATSAPP_SEND_FAILED");
    }
  }

  logDevCodes({
    userId: params.userId,
    emailCode: emailVerifyCode,
    phoneCode: phoneVerifyCode,
    phoneTarget: phoneVerifyTarget,
  });

  return {
    verificationId: row.id,
    emailChanged: params.emailChanged,
    phoneChanged: params.phoneChanged,
  };
}

export async function confirmProfileContactVerification(
  admin: SupabaseClient,
  params: {
    userId: string;
    verificationId: string;
    emailCode: string;
    phoneCode: string;
  },
): Promise<ProfileContactVerificationPayload> {
  const { data: row, error: fetchError } = await admin
    .from("profile_contact_verifications")
    .select("*")
    .eq("id", params.verificationId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!row) {
    throw new Error("PROFILE_CONTACT_VERIFY_EXPIRED");
  }

  const record = row as ProfileContactVerificationRow;

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await admin
      .from("profile_contact_verifications")
      .delete()
      .eq("id", params.verificationId);
    throw new Error("PROFILE_CONTACT_VERIFY_EXPIRED");
  }

  const emailChanged = Boolean(record.email_code_hash);
  const phoneChanged = Boolean(record.phone_code_hash);

  if (emailChanged) {
    if (!isValidContactVerifyCode(params.emailCode)) {
      throw new Error("PROFILE_CONTACT_EMAIL_CODE_INVALID");
    }

    const expectedEmail = record.new_email ?? record.payload.email;
    const emailHash = hashContactVerifyCode(
      "email",
      expectedEmail,
      params.emailCode,
    );

    if (emailHash !== record.email_code_hash) {
      const nextAttempts = record.email_attempts + 1;
      if (nextAttempts >= CONTACT_VERIFY_MAX_ATTEMPTS) {
        await admin
          .from("profile_contact_verifications")
          .delete()
          .eq("id", params.verificationId);
        throw new Error("PROFILE_CONTACT_EMAIL_ATTEMPTS");
      }

      await admin
        .from("profile_contact_verifications")
        .update({ email_attempts: nextAttempts })
        .eq("id", params.verificationId);
      throw new Error("PROFILE_CONTACT_EMAIL_CODE_WRONG");
    }
  }

  if (phoneChanged) {
    if (!isValidContactVerifyCode(params.phoneCode)) {
      throw new Error("PROFILE_CONTACT_PHONE_CODE_INVALID");
    }

    const phoneTarget = record.new_phone ?? record.old_phone ?? "";
    const phoneHash = hashContactVerifyCode(
      "phone",
      phoneTarget,
      params.phoneCode,
    );

    if (phoneHash !== record.phone_code_hash) {
      const nextAttempts = record.phone_attempts + 1;
      if (nextAttempts >= CONTACT_VERIFY_MAX_ATTEMPTS) {
        await admin
          .from("profile_contact_verifications")
          .delete()
          .eq("id", params.verificationId);
        throw new Error("PROFILE_CONTACT_PHONE_ATTEMPTS");
      }

      await admin
        .from("profile_contact_verifications")
        .update({ phone_attempts: nextAttempts })
        .eq("id", params.verificationId);
      throw new Error("PROFILE_CONTACT_PHONE_CODE_WRONG");
    }
  }

  if (emailChanged && record.new_email) {
    const existing = await findAuthUserByEmail(record.new_email);
    if (existing && existing.id !== params.userId) {
      throw new Error("PROFILE_CONTACT_EMAIL_IN_USE");
    }
  }

  await admin
    .from("profile_contact_verifications")
    .delete()
    .eq("id", params.verificationId);

  return record.payload;
}

export async function applyProfileContactPayload(
  admin: SupabaseClient,
  userId: string,
  payload: ProfileContactVerificationPayload,
  oldEmail: string,
): Promise<void> {
  const localizedNames = await resolveProfileNamesFromFields(
    payload.full_name_ar,
    payload.full_name_en,
  );

  if (!emailsEqual(oldEmail, payload.email)) {
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      email: payload.email,
      email_confirm: true,
      user_metadata: {
        full_name: localizedNames.full_name,
        full_name_ar: localizedNames.full_name_ar,
        full_name_en: localizedNames.full_name_en,
        phone: payload.phone,
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }
  } else {
    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        full_name: localizedNames.full_name,
        full_name_ar: localizedNames.full_name_ar,
        full_name_en: localizedNames.full_name_en,
        phone: payload.phone,
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }
  }

  const profileUpdate: Record<string, unknown> = {
    full_name: localizedNames.full_name,
    full_name_ar: localizedNames.full_name_ar,
    full_name_en: localizedNames.full_name_en,
    phone: payload.phone,
  };

  if (payload.avatar_url) {
    profileUpdate.avatar_url = payload.avatar_url;
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update(profileUpdate)
    .eq("id", userId);

  if (profileError) {
    throw new Error(profileError.message);
  }
}

export { emailsEqual, phonesEqual };
