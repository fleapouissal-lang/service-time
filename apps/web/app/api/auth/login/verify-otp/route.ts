import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { purgeSupabaseAuthCookieChunks } from "@/lib/auth-cookies";
import { getLoginProfile } from "@/lib/auth-users";
import { ensureServerEnv } from "@/lib/env-server";
import { checkLoginRateLimit } from "@/lib/form-security";
import {
  isValidLoginOtpFormat,
  LOGIN_OTP_MAX_ATTEMPTS,
  matchesLoginOtpHash,
  normalizeEmail,
} from "@/lib/login-otp";
import { resolveLoginEmail } from "@/lib/resolve-login-email";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

async function safeSignOut(supabase: SupabaseClient): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error("[login/verify-otp] signOut:", error);
  }
}

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

    let body: { identifier?: string; password?: string; code?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
    }

    const identifier = (body.identifier ?? "").trim();
    const password = body.password ?? "";
    const code = (body.code ?? "").trim();

    if (!identifier || !password || !isValidLoginOtpFormat(code)) {
      return NextResponse.json(
        { error: "أدخل البريد/الجوال وكلمة المرور ورمز التحقق المكوّن من 6 أرقام." },
        { status: 400 },
      );
    }

    if (!(await checkLoginRateLimit(`otp:${identifier}`))) {
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

    const normalizedEmail = normalizeEmail(email);

    const { data: record, error } = await admin
      .from("login_otp_codes")
      .select("id, user_id, code_hash, attempts, expires_at, verified_at")
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[login/verify-otp]", error);
      return NextResponse.json(
        { error: "تعذّر التحقق من الرمز." },
        { status: 500 },
      );
    }

    if (!record || record.verified_at) {
      return NextResponse.json(
        { error: "اطلب رمز تحقق جديداً من صفحة الدخول." },
        { status: 404 },
      );
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "انتهت صلاحية الرمز. اطلب رمزاً جديداً." },
        { status: 410 },
      );
    }

    if (record.attempts >= LOGIN_OTP_MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "تجاوزت عدد المحاولات. اطلب رمزاً جديداً." },
        { status: 429 },
      );
    }

    if (!matchesLoginOtpHash(record.code_hash, normalizedEmail, code)) {
      await admin
        .from("login_otp_codes")
        .update({ attempts: record.attempts + 1 })
        .eq("id", record.id);

      return NextResponse.json({ error: "الرمز غير صحيح." }, { status: 401 });
    }

    const cookieStore = await cookies();
    const setAuthCookie = (name: string, value: string, options: CookieOptions) =>
      cookieStore.set(name, value, options);

    purgeSupabaseAuthCookieChunks(cookieStore.getAll(), setAuthCookie);

    const supabase = createSupabaseServerClient({
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    });

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (authError || !data.user) {
      return NextResponse.json(
        { error: authError?.message || "بيانات الدخول غير صحيحة." },
        { status: 401 },
      );
    }

    if (data.user.id !== record.user_id) {
      await safeSignOut(supabase);
      return NextResponse.json(
        { error: "تعذّر إكمال تسجيل الدخول." },
        { status: 403 },
      );
    }

    const profile = await getLoginProfile(data.user.id);
    if (profile === "lookup_failed" || !profile || !profile.is_active) {
      await safeSignOut(supabase);
      return NextResponse.json(
        { error: "تعذّر تحميل الملف الشخصي." },
        { status: 403 },
      );
    }

    if (profile.role !== "admin") {
      await safeSignOut(supabase);
      return NextResponse.json(
        { error: "رمز التحقق مخصّص لحسابات الإدارة فقط." },
        { status: 403 },
      );
    }

    await admin
      .from("login_otp_codes")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", record.id);

    await admin.from("login_otp_codes").delete().eq("email", normalizedEmail).neq("id", record.id);

    return NextResponse.json(
      { role: profile.role, ok: true },
      {
        headers: {
          "Cache-Control": "private, no-store, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("[login/verify-otp] unhandled:", error);
    return NextResponse.json(
      { error: "خطأ في الخادم أثناء التحقق." },
      { status: 500 },
    );
  }
}
