import { NextResponse } from "next/server";
import { findAuthUserByEmail } from "@/lib/auth-users";
import { checkRegisterRateLimit } from "@/lib/form-security";
import {
  RESET_CODE_TTL_MS,
  RESET_REQUESTS_PER_HOUR,
  generateResetCode,
  hashResetCode,
  normalizeEmail,
} from "@/lib/password-reset";
import { sendClientVerificationCode } from "@/lib/send-email";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { buildWhatsAppRegistrationHelpUrl } from "@/lib/whatsapp";
import { sendWhatsAppMessage } from "@/lib/whatsapp-send";
import { normalizePhone } from "@/lib/whatsapp-utils";

const GENERIC_OK_MESSAGE =
  "إذا كان البريد غير مسجّل لدينا، ستتلقى رمز التحقق على بريدك.";

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
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");
  if (!email.includes("@")) {
    return NextResponse.json(
      { error: "أدخل بريداً إلكترونياً صالحاً." },
      { status: 400 },
    );
  }

  if (!(await checkRegisterRateLimit())) {
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

  const existing = await findAuthUserByEmail(email);
  if (!existing || existing.email_confirmed_at) {
    return genericOk();
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from("client_verification_codes")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", oneHourAgo);

  if (countError) {
    console.error("[register/resend-code] count:", countError);
    return NextResponse.json(
      { error: "تعذّر معالجة الطلب." },
      { status: 500 },
    );
  }

  if ((count ?? 0) >= RESET_REQUESTS_PER_HOUR) {
    return NextResponse.json(
      { error: "تم تجاوز حد الطلبات. انتظر ساعة ثم حاول مجدداً." },
      { status: 429 },
    );
  }

  const { data: previousCode } = await admin
    .from("client_verification_codes")
    .select("phone, avatar_storage_path")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const meta = existing.user_metadata ?? {};
  const displayNameAr =
    (meta.full_name_ar as string | undefined)?.trim() ||
    (meta.full_name as string | undefined)?.trim() ||
    email;
  const phoneRaw =
    previousCode?.phone ??
    (meta.phone as string | undefined)?.trim() ??
    "";
  const phone = phoneRaw ? normalizePhone(phoneRaw) : "";

  if (!phone) {
    return genericOk();
  }

  const code = generateResetCode();
  const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MS).toISOString();

  await admin.from("client_verification_codes").delete().eq("email", email);

  const { error: insertError } = await admin
    .from("client_verification_codes")
    .insert({
      user_id: existing.id,
      email,
      phone,
      code_hash: hashResetCode(email, code),
      expires_at: expiresAt,
      avatar_storage_path: previousCode?.avatar_storage_path ?? null,
    });

  if (insertError) {
    console.error("[register/resend-code] insert:", insertError);
    return NextResponse.json(
      { error: "تعذّr إنشاء رمز التحقق." },
      { status: 500 },
    );
  }

  const mail = await sendClientVerificationCode(email, code, displayNameAr);
  if (!mail.ok) {
    return NextResponse.json({ error: mail.error }, { status: 502 });
  }

  const whatsappCodeText = [
    `مرحباً ${displayNameAr}،`,
    "رمز تفعيل حسابك في Service Time:",
    code,
    "أدخل هذا الرمز في صفحة تسجيل الدخول (صلاحية 10 دقائق).",
  ].join("\n");

  void sendWhatsAppMessage(phone, whatsappCodeText).then((result) => {
    if (result.ok && !result.dev) {
      console.info(`[register/resend-code] WhatsApp sent to ${phone}`);
    } else if (!result.ok) {
      console.warn("[register/resend-code] WhatsApp:", result.error);
    }
  });

  return NextResponse.json({
    ok: true,
    message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني.",
    whatsappUrl: buildWhatsAppRegistrationHelpUrl(phone, displayNameAr),
    expiresInSeconds: RESET_CODE_TTL_MS / 1000,
    devMode: mail.dev === true,
  });
}
