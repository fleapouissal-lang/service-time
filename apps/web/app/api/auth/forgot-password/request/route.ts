import { NextResponse } from "next/server";
import {
  RESET_CODE_TTL_MS,
  RESET_REQUESTS_PER_HOUR,
  generateResetCode,
  hashResetCode,
  normalizeEmail,
} from "@/lib/password-reset";
import { findAuthUserByEmail, isActivePlatformUser } from "@/lib/auth-users";
import { sendPasswordResetCode } from "@/lib/send-email";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { checkForgotPasswordRateLimit } from "@/lib/form-security";

const GENERIC_OK_MESSAGE =
  "إذا كان البريد مسجّلاً لدينا، تم إرسال رمز التحقق إليه.";

export async function POST(request: Request) {
  const admin = getAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: "إعدادات الخادم غير مكتملة." },
      { status: 503 },
    );
  }

  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "أدخل بريداً إلكترونياً صالحاً." },
      { status: 400 },
    );
  }

  if (!(await checkForgotPasswordRateLimit(email))) {
    return NextResponse.json(
      { error: "تم تجاوز حد الطلبات. انتظر ساعة ثم حاول مجدداً." },
      { status: 429 },
    );
  }

  const genericOk = () =>
    NextResponse.json({
      ok: true,
      message: GENERIC_OK_MESSAGE,
      expiresInSeconds: RESET_CODE_TTL_MS / 1000,
    });

  const user = await findAuthUserByEmail(email);
  if (!user) {
    return genericOk();
  }

  const active = await isActivePlatformUser(user.id);
  if (!active) {
    return genericOk();
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from("password_reset_codes")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", oneHourAgo);

  if (countError) {
    console.error("[forgot-password/request] count:", countError);
    const missingTable =
      countError.code === "PGRST205" ||
      countError.message?.includes("password_reset_codes");
    return NextResponse.json(
      {
        error: missingTable
          ? "جدول رموز التحقق غير موجود. شغّل migration password_reset_codes في Supabase."
          : "تعذّر معالجة الطلب.",
      },
      { status: 500 },
    );
  }

  if ((count ?? 0) >= RESET_REQUESTS_PER_HOUR) {
    return NextResponse.json(
      { error: "تم تجاوز حد الطلبات. انتظر ساعة ثم حاول مجدداً." },
      { status: 429 },
    );
  }

  const code = generateResetCode();
  const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MS).toISOString();

  await admin.from("password_reset_codes").delete().eq("email", email);

  const { error: insertError } = await admin.from("password_reset_codes").insert({
    user_id: user.id,
    email,
    code_hash: hashResetCode(email, code),
    expires_at: expiresAt,
  });

  if (insertError) {
    console.error("[forgot-password/request] insert:", insertError);
    const missingTable =
      insertError.code === "PGRST205" ||
      insertError.message?.includes("password_reset_codes");
    return NextResponse.json(
      {
        error: missingTable
          ? "جدول رموز التحقق غير موجود. شغّل migration password_reset_codes في Supabase."
          : "تعذّر إنشاء رمز التحقق.",
      },
      { status: 500 },
    );
  }

  const sent = await sendPasswordResetCode(email, code);
  if (!sent.ok) {
    return NextResponse.json({ error: sent.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني.",
    expiresInSeconds: RESET_CODE_TTL_MS / 1000,
    devMode: sent.dev === true,
  });
}
