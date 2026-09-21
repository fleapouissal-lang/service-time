import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateLoginOtpCode,
  hashLoginOtpCode,
  LOGIN_OTP_REQUESTS_PER_HOUR,
  LOGIN_OTP_TTL_MS,
  normalizeEmail,
} from "@/lib/login-otp";
import { sendLoginOtpCode } from "@/lib/send-email";

type IssueLoginOtpResult =
  | { ok: true; email: string; expiresInSeconds: number; devMode?: boolean }
  | { ok: false; error: string; status: number };

export async function issueAdminLoginOtp(
  admin: SupabaseClient,
  userId: string,
  emailRaw: string,
): Promise<IssueLoginOtpResult> {
  const email = normalizeEmail(emailRaw);
  if (!email) {
    return { ok: false, error: "البريد غير صالح.", status: 400 };
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from("login_otp_codes")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", oneHourAgo);

  if (countError) {
    console.error("[login-otp] count:", countError);
    const missingTable =
      countError.code === "PGRST205" ||
      countError.message?.includes("login_otp_codes");
    return {
      ok: false,
      error: missingTable
        ? "جدول رموز الدخول غير موجود. شغّل migration super_admin_login_otp."
        : "تعذّر إنشاء رمز التحقق.",
      status: 500,
    };
  }

  if ((count ?? 0) >= LOGIN_OTP_REQUESTS_PER_HOUR) {
    return {
      ok: false,
      error: "تم تجاوز حد طلبات الرمز. انتظر ثم حاول مجدداً.",
      status: 429,
    };
  }

  const code = generateLoginOtpCode();
  const expiresAt = new Date(Date.now() + LOGIN_OTP_TTL_MS).toISOString();

  await admin.from("login_otp_codes").delete().eq("email", email);

  const { error: insertError } = await admin.from("login_otp_codes").insert({
    user_id: userId,
    email,
    code_hash: hashLoginOtpCode(email, code),
    expires_at: expiresAt,
  });

  if (insertError) {
    console.error("[login-otp] insert:", insertError);
    const missingTable =
      insertError.code === "PGRST205" ||
      insertError.message?.includes("login_otp_codes");
    return {
      ok: false,
      error: missingTable
        ? "جدول رموز الدخول غير موجود. شغّل migration super_admin_login_otp."
        : "تعذّر إنشاء رمز التحقق.",
      status: 500,
    };
  }

  const sent = await sendLoginOtpCode(email, code);
  if (!sent.ok) {
    return { ok: false, error: sent.error, status: 502 };
  }

  return {
    ok: true,
    email,
    expiresInSeconds: LOGIN_OTP_TTL_MS / 1000,
    devMode: sent.dev === true,
  };
}
