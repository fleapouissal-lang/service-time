"use client";

import { useEffect, useState } from "react";
import type { ProfileRole } from "@service-time/types";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import { createAuthBrowserClient } from "@/lib/supabase-browser";
import type { Locale } from "@/lib/i18n/config";

export type AuthProfile = {
  fullName: string;
  role: ProfileRole;
  avatarUrl: string | null;
};

export function useAuthProfile(locale: Locale) {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createAuthBrowserClient();

    async function loadProfile() {
      try {
        const authResult = await Promise.race([
          supabase.auth.getUser(),
          new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error("auth-timeout")), 6_000);
          }),
        ]);

        const user = authResult.data.user;
        if (!user) {
          if (!cancelled) {
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select(
            "full_name, full_name_ar, full_name_en, role, avatar_url, is_active",
          )
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (data?.is_active && data.role) {
          setProfile({
            fullName: getProfileDisplayName(data, locale),
            role: data.role as ProfileRole,
            avatarUrl: data.avatar_url ?? null,
          });
        } else {
          setProfile(null);
        }
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadProfile();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [locale]);

  return { profile, loading };
}
