import "server-only";

import { createClient } from "@supabase/supabase-js";
import { isEmailNotConfirmedError } from "@/lib/auth-errors";
import { ensureServerEnv, getSupabaseUrl } from "@/lib/env-server";
import { normalizeEmail } from "@/lib/password-reset";

/** Vérifie le mot de passe sans modifier la session courante. */
export async function verifyUserPassword(
  email: string,
  password: string,
): Promise<boolean> {
  try {
    ensureServerEnv();
    const url = getSupabaseUrl();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!url || !anonKey || !password) return false;

    const client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await client.auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });

    if (!error) return true;
    if (isEmailNotConfirmedError(error.message)) return true;
    return false;
  } catch (err) {
    console.error("[verifyUserPassword]", err);
    return false;
  }
}
