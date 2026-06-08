import { createServerClient } from "@supabase/ssr";
import type { CookieMethodsServer } from "@supabase/ssr";
import {
  AUTH_COOKIE_DEFAULTS,
  applySessionAuthCookies,
} from "@/lib/auth-cookies";

type ServerCookieHandlers = Pick<CookieMethodsServer, "getAll" | "setAll">;

export function createSupabaseServerClient(handlers: ServerCookieHandlers) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: handlers.getAll,
        setAll: handlers.setAll
          ? (cookiesToSet, headers) => {
              const secured = applySessionAuthCookies(cookiesToSet);
              return handlers.setAll!(secured, headers);
            }
          : undefined,
      },
      cookieOptions: AUTH_COOKIE_DEFAULTS,
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
      },
    },
  );
}
