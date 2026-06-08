import {
  createBrowserClient,
  parseCookieHeader,
  serializeCookieHeader,
} from "@supabase/ssr";
import {
  AUTH_COOKIE_DEFAULTS,
  applySessionAuthCookieOptions,
} from "@/lib/auth-cookies";

export function createAuthBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === "undefined") return [];
          return (parseCookieHeader(document.cookie) ?? []).map(
            ({ name, value }) => ({
              name,
              value: value ?? "",
            }),
          );
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = serializeCookieHeader(
              name,
              value,
              applySessionAuthCookieOptions(options, !value),
            );
          });
        },
      },
      cookieOptions: AUTH_COOKIE_DEFAULTS,
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
      },
    },
  );
}
