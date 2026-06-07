"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { ProfileRole } from "@service-time/types";
import { getProfileHomePath } from "@/lib/profile-home";
import { createAuthBrowserClient } from "@/lib/supabase-browser";

export function useRequireClientForCart() {
  const router = useRouter();

  const requireClient = useCallback(async (): Promise<boolean> => {
    const supabase = createAuthBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const nextPath =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/spare-parts";

    if (!user) {
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      return false;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_active || !profile.role) {
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      return false;
    }

    const role = profile.role as ProfileRole;

    if (role !== "client") {
      router.push(getProfileHomePath(role));
      return false;
    }

    return true;
  }, [router]);

  return { requireClient };
}
