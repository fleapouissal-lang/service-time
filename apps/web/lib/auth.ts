import { cookies } from "next/headers";
import type { Profile } from "@service-time/types";
import { ensureServerEnv } from "@/lib/env-server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import "server-only";

export async function createAuthServerClient() {
  ensureServerEnv();
  const cookieStore = await cookies();

  return createSupabaseServerClient({
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      } catch {
        // Server Component — ignore
      }
    },
  });
}

export async function getSession() {
  const supabase = await createAuthServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (data as Profile | null) ?? null;
}

export async function requireProfile(roles?: Profile["role"][]) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active) return null;
  if (roles && !roles.includes(profile.role)) return null;
  return profile;
}

/** Fail closed for mutations — throws when unauthenticated or wrong role. */
export async function requireProfileOrThrow(
  roles?: Profile["role"][],
): Promise<Profile> {
  const profile = await requireProfile(roles);
  if (!profile) {
    throw new Error("Unauthorized");
  }
  return profile;
}
