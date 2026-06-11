import type { User } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabaseUrl } from "@/lib/env-server";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { normalizeEmail } from "@/lib/password-reset";
import type { ProfileRole } from "@service-time/types";

export type LoginProfileRow = {
  role: ProfileRole;
  is_active: boolean;
};

async function findAuthUserByEmailViaGoTrue(
  email: string,
): Promise<User | null> {
  const supabaseUrl = getSupabaseUrl();
  const serviceKey = getServiceRoleKey();
  if (!supabaseUrl || !serviceKey) return null;

  const target = normalizeEmail(email);
  const filter = encodeURIComponent(`email.eq.${target}`);
  const url = `${supabaseUrl.replace(/\/$/, "")}/auth/v1/admin/users?filter=${filter}&page=1&per_page=1`;

  try {
    const response = await fetchWithTimeout(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      timeoutMs: 8_000,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "[auth-users] getUserByEmail filter:",
        response.status,
        await response.text().catch(() => ""),
      );
      return null;
    }

    const payload = (await response.json()) as { users?: User[] };
    const user = payload.users?.[0];
    if (user?.email?.toLowerCase() === target) {
      return user;
    }
  } catch (error) {
    console.error("[auth-users] getUserByEmail filter:", error);
  }

  return null;
}

export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const fast = await findAuthUserByEmailViaGoTrue(email);
  if (fast) return fast;

  const admin = getAdminSupabaseClient();
  if (!admin) return null;

  const target = normalizeEmail(email);

  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error) {
    console.error("[auth-users] listUsers:", error.message);
    return null;
  }

  return (
    data.users.find((user) => user.email?.toLowerCase() === target) ?? null
  );
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
