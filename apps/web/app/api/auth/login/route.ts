import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearSupabaseAuthCookies } from "@/lib/auth-cookies";
import { isActivePlatformUser } from "@/lib/auth-users";
import { ensureServerEnv } from "@/lib/env-server";
import { resolveLoginEmail } from "@/lib/resolve-login-email";
import { checkLoginRateLimit } from "@/lib/form-security";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import type { ProfileRole } from "@service-time/types";

export async function POST(request: Request) {
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
    return NextResponse.json(
      { error: authError?.message ?? "Invalid login credentials" },
      { status: 401 },
    );
  }

  // Force l'écriture des cookies de session avant la réponse JSON
  await supabase.auth.getSession();

  const active = await isActivePlatformUser(data.user.id);
  if (!active) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "account inactive" },
      { status: 403 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  const role = (profile?.role as ProfileRole | undefined) ?? "client";

  return NextResponse.json(
    { role },
    {
      headers: {
        "Cache-Control": "private, no-store, must-revalidate",
      },
    },
  );
}
