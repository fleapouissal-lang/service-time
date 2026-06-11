import type { User } from "@supabase/supabase-js";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { normalizeEmail } from "@/lib/password-reset";
import type { ProfileRole } from "@service-time/types";

export type LoginProfileRow = {
  role: ProfileRole;
  is_active: boolean;
};

export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const admin = getAdminSupabaseClient();
  if (!admin) return null;

  const target = normalizeEmail(email);
  let page = 1;

  while (page <= 3) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      console.error("[auth-users] listUsers:", error.message);
      return null;
    }

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === target,
    );
    if (match) return match;

    if (data.users.length < 200) break;
    page += 1;
  }

  return null;
}

export async function getLoginProfile(
  userId: string,
): Promise<LoginProfileRow | null | "lookup_failed"> {
  const admin = getAdminSupabaseClient();
  if (!admin) return "lookup_failed";

  const { data, error } = await admin
    .from("profiles")
    .select("role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[auth-users] getLoginProfile:", error.message);
    return "lookup_failed";
  }

  if (!data?.role) return null;

  return {
    role: data.role as ProfileRole,
    is_active: Boolean(data.is_active),
  };
}

/** @deprecated Prefer getLoginProfile during login. */
export async function isActivePlatformUser(userId: string): Promise<boolean> {
  const profile = await getLoginProfile(userId);
  if (profile === "lookup_failed" || profile === null) return false;
  return profile.is_active;
}
