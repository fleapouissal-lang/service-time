"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearAuthTabSession,
  clearLegacySupabaseStorage,
  hasAuthTabSession,
  isWithinLoginGracePeriod,
} from "@/lib/auth-cookies";
import { signOutAndRedirect } from "@/lib/sign-out-client";
import { createAuthBrowserClient } from "@/lib/supabase-browser";

const PUBLIC_AUTH_PATHS = new Set(["/login", "/register"]);

/**
 * Si des cookies auth existent sans marqueur sessionStorage (onglet fermé,
 * navigateur rouvert, nouvelle fenêtre), déconnexion immédiate.
 */
export function AuthSessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (PUBLIC_AUTH_PATHS.has(pathname)) return;

    async function enforce() {
      if (hasAuthTabSession() || isWithinLoginGracePeriod()) return;

      const supabase = createAuthBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      clearLegacySupabaseStorage();
      clearAuthTabSession();
      await signOutAndRedirect(router);
    }

    void enforce();
  }, [pathname, router]);

  return null;
}
