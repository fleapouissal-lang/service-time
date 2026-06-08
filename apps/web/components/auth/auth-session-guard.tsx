"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  clearAuthTabSession,
  clearLegacySupabaseStorage,
  hasAuthTabSession,
} from "@/lib/auth-cookies";
import { signOutAndRedirect } from "@/lib/sign-out-client";
import { createAuthBrowserClient } from "@/lib/supabase-browser";

/**
 * Si des cookies auth existent sans marqueur sessionStorage (onglet fermé,
 * navigateur rouvert, nouvelle fenêtre), déconnexion immédiate.
 */
export function AuthSessionGuard() {
  const router = useRouter();
  const running = useRef(false);

  useEffect(() => {
    if (running.current) return;
    running.current = true;

    async function enforce() {
      if (hasAuthTabSession()) return;

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
  }, [router]);

  return null;
}
