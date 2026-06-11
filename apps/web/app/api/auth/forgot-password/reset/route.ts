import { NextResponse } from "next/server";
import {
  isStrongEnoughPassword,
  PASSWORD_REQUIREMENTS_AR,
} from "@/lib/password-policy";
import {
  RESET_VERIFY_WINDOW_MS,
  hashResetCode,
  isValidResetCodeFormat,
  matchesResetCodeHash,
  normalizeEmail,
} from "@/lib/password-reset";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const admin = getAdminSupabaseClient();
  if (!admin) {
    return NextResponse.json(
      { error: "إعدادات الخادم غير مكتملة." },
      { status: 503 },
    );
  }

  let body: {
    email?: string;
    code?: string;
    password?: string;
    confirmPassword?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");
  const code = (body.code ?? "").trim();
  const password = body.password ?? "";
  const confirmPassword = body.confirmPassword ?? "";

  if (!email || !isValidResetCodeFormat(code)) {
    return NextResponse.json(
      { error: "البريد أو الرمز غير صالح." },
      { status: 400 },
    );
  }

  if (!isStrongEnoughPassword(password)) {
    return NextResponse.json(
      { error: PASSWORD_REQUIREMENTS_AR },
      { status: 400 },
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "كلمتا المرور غير متطابقتين." },
      { status: 400 },
    );
  }

  const { data: record, error } = await admin
    .from("password_reset_codes")
    .select("id, user_id, code_hash, expires_at, verified_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !record) {
    return NextResponse.json(
      { error: "جلسة إعادة التعيين غير صالحة." },
      { status: 404 },
    );
  }

  if (!record.verified_at) {
    return NextResponse.json(
      { error: "يجب التحقق من الرمز أولاً." },
      { status: 403 },
    );
  }

  const verifiedAt = new Date(record.verified_at).getTime();
  if (Date.now() - verifiedAt > RESET_VERIFY_WINDOW_MS) {
    return NextResponse.json(
      { error: "انتهت جلسة إعادة التعيين. ابدأ من جديد." },
      { status: 410 },
    );
  }

  if (
    new Date(record.expires_at).getTime() < Date.now() ||
    !matchesResetCodeHash(record.code_hash, email, code)
  ) {
    return NextResponse.json(
      { error: "الرمز غير صالح أو منتهي الصلاحية." },
      { status: 401 },
    );
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    record.user_id,
    { password },
  );

  if (updateError) {
    console.error("[forgot-password/reset]", updateError);
    return NextResponse.json(
      { error: "تعذّر تحديث كلمة المرور." },
      { status: 500 },
    );
  }

  await admin.from("password_reset_codes").delete().eq("id", record.id);

  return NextResponse.json({
    ok: true,
    message: "تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.",
  });
}
