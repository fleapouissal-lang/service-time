import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isActivePlatformUser } from "@/lib/auth-users";
import { ensureServerEnv } from "@/lib/env-server";
import { resolveLoginEmail } from "@/lib/resolve-login-email";
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

  const email = await resolveLoginEmail(identifier);
  if (!email) {
    return NextResponse.json(
      { error: "user not found" },
      { status: 404 },
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

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

  return NextResponse.json({
    role: (profile?.role as ProfileRole | undefined) ?? "client",
  });
}
