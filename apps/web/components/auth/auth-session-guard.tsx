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

    let cancelled = false;

    const enforce = async () => {
      if (cancelled) return;
      if (hasAuthTabSession() || isWithinLoginGracePeriod()) return;

      const supabase = createAuthBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      clearLegacySupabaseStorage();
      clearAuthTabSession();
      await signOutAndRedirect(router);
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(
        () => {
          void enforce();
        },
        { timeout: 3000 },
      );
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const timer = globalThis.setTimeout(() => {
      void enforce();
    }, 1500);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
    };
  }, [pathname, router]);

  return null;
}
