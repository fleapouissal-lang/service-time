import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  clearSupabaseAuthCookies,
  isSupabaseAuthCookieName,
} from "@/lib/auth-cookies";
import { ensureServerEnv } from "@/lib/env-server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST() {
  ensureServerEnv();

  const cookieStore = await cookies();
  const existing = cookieStore.getAll();

  clearSupabaseAuthCookies(existing, (name, value, options) =>
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

  await supabase.auth.signOut();

  for (const cookie of cookieStore.getAll()) {
    if (isSupabaseAuthCookieName(cookie.name)) {
      cookieStore.set(cookie.name, "", { path: "/", maxAge: 0 });
    }
  }

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "private, no-store, must-revalidate",
      },
    },
  );
}
