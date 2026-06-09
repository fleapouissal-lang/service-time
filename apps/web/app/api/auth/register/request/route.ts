import { NextResponse } from "next/server";
import { findAuthUserByEmail } from "@/lib/auth-users";
import {
  RESET_CODE_TTL_MS,
  RESET_REQUESTS_PER_HOUR,
  generateResetCode,
  hashResetCode,
  isStrongEnoughPassword,
} from "@/lib/password-reset";
import { sendClientVerificationCode } from "@/lib/send-email";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { uploadProfileAvatar } from "@/lib/upload-profile-avatar";
import { buildWhatsAppVerificationUrl } from "@/lib/whatsapp";
import {
  contactValidationErrorMessageAr,
  validateRequiredContact,
} from "@/lib/contact-validation";

async function parseRegisterPayload(request: Request): Promise<{
  fullNameAr: string;
  fullNameEn: string;
  phone: string;
  email: string;
  password: string;
  avatarFile: File | null;
}> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const avatar = formData.get("avatar");
    const legacyName = String(formData.get("fullName") ?? "").trim();
    const fullNameAr =
      String(formData.get("fullNameAr") ?? "").trim() || legacyName;
    const fullNameEn = String(formData.get("fullNameEn") ?? "").trim();
    return {
      fullNameAr,
      fullNameEn,
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      avatarFile:
        avatar instanceof File && avatar.size > 0 ? avatar : null,
    };
  }

  const body = (await request.json()) as {
    fullName?: string;
    fullNameAr?: string;
    fullNameEn?: string;
    phone?: string;
    email?: string;
    password?: string;
  };

  const legacyName = (body.fullName ?? "").trim();
  return {
    fullNameAr: (body.fullNameAr ?? "").trim() || legacyName,
    fullNameEn: (body.fullNameEn ?? "").trim(),
    phone: (body.phone ?? "").trim(),
    email: (body.email ?? "").trim(),
    password: body.password ?? "",
    avatarFile: null,
  };
}

export async function POST(request: Request) {
  const admin = getAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: "إعدادات الخادم غير مكتملة." },
      { status: 503 },
    );
  }

  let payload: Awaited<ReturnType<typeof parseRegisterPayload>>;
  try {
    payload = await parseRegisterPayload(request);
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const fullNameAr = payload.fullNameAr;
  const fullNameEn = payload.fullNameEn;
  const password = payload.password;
  const avatarFile = payload.avatarFile;

  if (fullNameAr.length < 2) {
    return NextResponse.json({ error: "أدخل الاسم بالعربية." }, { status: 400 });
  }

  if (fullNameEn.length < 2) {
    return NextResponse.json({ error: "أدخل الاسم بالإنجليزية." }, { status: 400 });
  }

  const displayNameAr = fullNameAr;

  const contact = validateRequiredContact(payload.email, payload.phone);
  if (!contact.ok) {
    return NextResponse.json(
      { error: contactValidationErrorMessageAr(contact.error) },
      { status: 400 },
    );
  }

  const phone = contact.phone;
  const email = contact.email;

  if (!isStrongEnoughPassword(password)) {
    return NextResponse.json(
      { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." },
      { status: 400 },
    );
  }

  const existing = await findAuthUserByEmail(email);
  if (existing?.email_confirmed_at) {
    return NextResponse.json(
      { error: "هذا البريد مسجّل مسبقاً. سجّل الدخول." },
      { status: 409 },
    );
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from("client_verification_codes")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", oneHourAgo);

  if (countError) {
    console.error("[register/request] count:", countError);
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

  let userId = existing?.id;

  if (existing) {
    const { error: updateError } = await admin.auth.admin.updateUserById(
      existing.id,
      {
        password,
        user_metadata: {
          full_name: displayNameAr,
          full_name_ar: fullNameAr,
          full_name_en: fullNameEn,
          phone,
        },
      },
    );
    if (updateError) {
      console.error("[register/request] update user:", updateError);
      return NextResponse.json(
        { error: "تعذّr تحديث الحساب." },
        { status: 500 },
      );
    }
  } else {
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
          full_name: displayNameAr,
          full_name_ar: fullNameAr,
          full_name_en: fullNameEn,
          phone,
        },
      });

    if (createError || !created.user) {
      console.error("[register/request] create user:", createError);
      return NextResponse.json(
        { error: createError?.message ?? "تعذّr إنشاء الحساب." },
        { status: 500 },
      );
    }

    userId = created.user.id;
  }

  if (!userId) {
    return NextResponse.json(
      { error: "تعذّr إنشاء الحساب." },
      { status: 500 },
    );
  }

  let avatarStoragePath: string | null = null;
  if (avatarFile) {
    const uploaded = await uploadProfileAvatar(userId, avatarFile);
    if ("error" in uploaded) {
      return NextResponse.json({ error: uploaded.error }, { status: 400 });
    }
    avatarStoragePath = uploaded.storagePath;
  }

  const code = generateResetCode();
  const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MS).toISOString();

  await admin.from("client_verification_codes").delete().eq("email", email);

  const { error: insertError } = await admin
    .from("client_verification_codes")
    .insert({
      user_id: userId,
      email,
      phone,
      code_hash: hashResetCode(email, code),
      expires_at: expiresAt,
      avatar_storage_path: avatarStoragePath,
    });

  if (insertError) {
    console.error("[register/request] insert:", insertError);
    return NextResponse.json(
      { error: "تعذّr إنشاء رمز التحقق." },
      { status: 500 },
    );
  }

  const mail = await sendClientVerificationCode(email, code, displayNameAr);
  if (!mail.ok) {
    return NextResponse.json({ error: mail.error }, { status: 502 });
  }

  console.info(`[register/request] verification code sent to ${email}`);

  return NextResponse.json({
    ok: true,
    message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني.",
    whatsappUrl: buildWhatsAppVerificationUrl(phone, code, displayNameAr),
    expiresInSeconds: RESET_CODE_TTL_MS / 1000,
    devMode: mail.dev === true,
  });
}
