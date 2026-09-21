import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getLoginProfile } from "@/lib/auth-users";
import { ensureServerEnv, getSupabaseUrl } from "@/lib/env-server";
import { checkLoginRateLimit } from "@/lib/form-security";
import { issueAdminLoginOtp } from "@/lib/issue-login-otp";
import { normalizeEmail } from "@/lib/login-otp";
import { resolveLoginEmail } from "@/lib/resolve-login-email";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Resend admin login OTP — requires correct email + password again (no session).
 */
export async function POST(request: Request) {
  try {
    ensureServerEnv();

    const admin = getAdminSupabaseClient();
    if (!admin) {
      return NextResponse.json(
        { error: "إعدادات الخادم غير مكتملة." },
        { status: 503 },
      );
    }

    let body: { identifier?: string; password?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
    }

    const identifier = (body.identifier ?? "").trim();
    const password = body.password ?? "";

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "أدخل البريد وكلمة المرور." },
        { status: 400 },
      );
    }

    if (!(await checkLoginRateLimit(`otp-resend:${identifier}`))) {
      return NextResponse.json(
        { error: "محاولات كثيرة. انتظر ثم حاول مجدداً." },
        { status: 429 },
      );
    }

    const email = await resolveLoginEmail(identifier);
    if (!email) {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة." },
        { status: 401 },
      );
    }

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
    const url = getSupabaseUrl();
    if (!url || !anonKey) {
      return NextResponse.json(
        { error: "إعدادات الخادم غير مكتملة." },
        { status: 503 },
      );
    }

    const probe = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error: authError } = await probe.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة." },
        { status: 401 },
      );
    }

    await probe.auth.signOut().catch(() => undefined);

    const profile = await getLoginProfile(data.user.id);
    if (
      profile === "lookup_failed" ||
      !profile ||
      !profile.is_active ||
      profile.role !== "admin"
    ) {
      return NextResponse.json(
        { error: "إعادة إرسال الرمز متاحة لحسابات الإدارة النشطة فقط." },
        { status: 403 },
      );
    }

    const otp = await issueAdminLoginOtp(
      admin,
      data.user.id,
      normalizeEmail(data.user.email ?? email),
    );
    if (!otp.ok) {
      return NextResponse.json({ error: otp.error }, { status: otp.status });
    }

    return NextResponse.json({
      ok: true,
      email: otp.email,
      expiresInSeconds: otp.expiresInSeconds,
      devMode: otp.devMode === true,
      message: "تم إرسال رمز تحقق جديد إلى بريدك.",
    });
  } catch (error) {
    console.error("[login/resend-otp] unhandled:", error);
    return NextResponse.json(
      { error: "خطأ في الخادم أثناء إعادة الإرسال." },
      { status: 500 },
    );
  }
}
