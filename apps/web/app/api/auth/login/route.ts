import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { purgeSupabaseAuthCookieChunks } from "@/lib/auth-cookies";
import { findAuthUserByEmail, getLoginProfile } from "@/lib/auth-users";
import { isEmailNotConfirmedError } from "@/lib/auth-errors";
import { ensureServerEnv } from "@/lib/env-server";
import { checkLoginRateLimit } from "@/lib/form-security";
import { issueAdminLoginOtp } from "@/lib/issue-login-otp";
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
    console.error("[login] signOut:", error);
  }
}

export async function POST(request: Request) {
  try {
    ensureServerEnv();

    const admin = getAdminSupabaseClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Server configuration is incomplete." },
        { status: 503 },
      );
    }

    let body: { identifier?: string; password?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const identifier = (body.identifier ?? "").trim();
    const password = body.password ?? "";

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Enter your email or phone and password." },
        { status: 400 },
      );
    }

    if (!(await checkLoginRateLimit(identifier))) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait and try again." },
        { status: 429 },
      );
    }

    const email = await resolveLoginEmail(identifier);
    if (!email) {
      return NextResponse.json(
        { error: "Invalid login credentials" },
        { status: 401 },
      );
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
      email,
      password,
    });

    if (authError || !data.user) {
      const authMessage = authError?.message ?? "";

      if (isEmailNotConfirmedError(authMessage)) {
        const pendingUser = await findAuthUserByEmail(email);
        if (pendingUser && !pendingUser.email_confirmed_at) {
          return NextResponse.json(
            { needsVerification: true, email },
            { status: 403 },
          );
        }
      }

      return NextResponse.json(
        { error: authMessage || "Invalid login credentials" },
        { status: 401 },
      );
    }

    const profile = await getLoginProfile(data.user.id);
    if (profile === "lookup_failed") {
      await safeSignOut(supabase);
      return NextResponse.json(
        { error: "Could not load user profile." },
        { status: 500 },
      );
    }

    if (!profile) {
      await safeSignOut(supabase);
      if (!data.user.email_confirmed_at) {
        return NextResponse.json(
          { needsVerification: true, email: data.user.email ?? email },
          { status: 403 },
        );
      }

      return NextResponse.json(
        { error: "account profile missing" },
        { status: 403 },
      );
    }

    if (!profile.is_active) {
      await safeSignOut(supabase);
      if (!data.user.email_confirmed_at) {
        return NextResponse.json(
          { needsVerification: true, email: data.user.email ?? email },
          { status: 403 },
        );
      }

      return NextResponse.json({ error: "account inactive" }, { status: 403 });
    }

    // Admin OTP (disabled by default until Super Admin mailbox is available).
    // Set ADMIN_LOGIN_OTP_ENABLED=true to require email OTP after password.
    const adminOtpEnabled =
      process.env.ADMIN_LOGIN_OTP_ENABLED?.trim().toLowerCase() === "true" ||
      process.env.ADMIN_LOGIN_OTP_ENABLED?.trim() === "1";

    if (profile.role === "admin" && adminOtpEnabled) {
      const userId = data.user.id;
      const otpEmail = normalizeLoginEmail(data.user.email ?? email);
      await safeSignOut(supabase);
      purgeSupabaseAuthCookieChunks(cookieStore.getAll(), setAuthCookie);

      const otp = await issueAdminLoginOtp(admin, userId, otpEmail);
      if (!otp.ok) {
        return NextResponse.json({ error: otp.error }, { status: otp.status });
      }

      return NextResponse.json(
        {
          needsLoginOtp: true,
          email: otp.email,
          expiresInSeconds: otp.expiresInSeconds,
          devMode: otp.devMode === true,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, no-store, must-revalidate",
          },
        },
      );
    }

    return NextResponse.json(
      { role: profile.role },
      {
        headers: {
          "Cache-Control": "private, no-store, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("[login] unhandled:", error);
    return NextResponse.json(
      { error: "Server error during login." },
      { status: 500 },
    );
  }
}

function normalizeLoginEmail(email: string): string {
  return email.trim().toLowerCase();
}
