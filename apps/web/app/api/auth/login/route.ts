import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearSupabaseAuthCookies } from "@/lib/auth-cookies";
import { findAuthUserByEmail, getLoginProfile } from "@/lib/auth-users";
import { isEmailNotConfirmedError } from "@/lib/auth-errors";
import { ensureServerEnv } from "@/lib/env-server";
import { resolveLoginEmail } from "@/lib/resolve-login-email";
import { checkLoginRateLimit } from "@/lib/form-security";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

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

    clearSupabaseAuthCookies(cookieStore.getAll(), (name, value, options) =>
      cookieStore.set(name, value, options),
    );

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

    await supabase.auth.getSession();

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
