import type { User } from "@supabase/supabase-js";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { normalizeEmail } from "@/lib/password-reset";

export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const admin = getAdminSupabaseClient();
  if (!admin) return null;

  const target = normalizeEmail(email);
  let page = 1;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) throw error;

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === target,
    );
    if (match) return match;

    if (data.users.length < 200) break;
    page += 1;
  }

  return null;
}

export async function isActivePlatformUser(userId: string): Promise<boolean> {
  const admin = getAdminSupabaseClient();
  if (!admin) return false;

  const { data, error } = await admin
    .from("profiles")
    .select("is_active")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.is_active);
}
