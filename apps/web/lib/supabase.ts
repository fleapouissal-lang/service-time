import { createSupabaseClient, type SupabaseConfig } from "@service-time/lib";

export function getWebSupabaseConfig(): SupabaseConfig {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
}

export function createWebSupabaseClient() {
  return createSupabaseClient(getWebSupabaseConfig());
}
