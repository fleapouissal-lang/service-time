import { NextResponse } from "next/server";
import {
  RESET_CODE_MAX_ATTEMPTS,
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

  let body: { email?: string; code?: string };
  try {
    body = (await request.json()) as { email?: string; code?: string };
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");
  const code = (body.code ?? "").trim();

  if (!email || !isValidResetCodeFormat(code)) {
    return NextResponse.json(
      { error: "أدخل البريد والرمز المكوّن من 6 أرقام." },
      { status: 400 },
    );
  }

  const { data: record, error } = await admin
    .from("password_reset_codes")
    .select("id, code_hash, attempts, expires_at, verified_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[forgot-password/verify]", error);
    return NextResponse.json(
      { error: "تعذّر التحقق من الرمز." },
      { status: 500 },
    );
  }

  if (!record) {
    return NextResponse.json(
      { error: "لم يتم طلب رمز لهذا البريد. اطلب رمزاً جديداً." },
      { status: 404 },
    );
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "انتهت صلاحية الرمز. اطلب رمزاً جديداً." },
      { status: 410 },
    );
  }

  if (record.attempts >= RESET_CODE_MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "تجاوزت عدد المحاولات. اطلب رمزاً جديداً." },
      { status: 429 },
    );
  }

  const isMatch = matchesResetCodeHash(record.code_hash, email, code);

  if (!isMatch) {
    await admin
      .from("password_reset_codes")
      .update({ attempts: record.attempts + 1 })
      .eq("id", record.id);

    return NextResponse.json(
      { error: "الرمز غير صحيح." },
      { status: 401 },
    );
  }

  await admin
    .from("password_reset_codes")
    .update({ verified_at: new Date().toISOString() })
    .eq("id", record.id);

  return NextResponse.json({
    ok: true,
    message: "تم التحقق من الرمز. يمكنك تعيين كلمة مرور جديدة.",
  });
}
