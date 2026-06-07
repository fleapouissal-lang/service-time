import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  ensureServerEnv,
  getServiceRoleKey,
  getSupabaseUrl,
} from "@/lib/env-server";

let adminClient: SupabaseClient | null = null;

/** Client serveur service_role — null si clé absente (fallback anon). */
export function getAdminSupabaseClient(): SupabaseClient | null {
  ensureServerEnv();

  const url = getSupabaseUrl();
  const serviceKey = getServiceRoleKey();

  if (!url || !serviceKey) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return adminClient;
}

export function hasAdminSupabaseConfig(): boolean {
  return getAdminSupabaseClient() !== null;
}
