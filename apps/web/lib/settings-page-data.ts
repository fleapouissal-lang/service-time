import { createAuthServerClient, requireProfile } from "@/lib/auth";
import type { Profile } from "@service-time/types";

export async function getDashboardSettingsPageData(
  roles: Profile["role"][],
): Promise<{ profile: Profile; email: string | null } | null> {
  const profile = await requireProfile(roles);
  if (!profile) return null;

  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    profile,
    email: user?.email ?? null,
  };
}
