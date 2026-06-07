import path from "path";
import { fileURLToPath } from "url";
import { loadEnvConfig } from "@next/env";

let loaded = false;

const webDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const rootDir = path.resolve(webDir, "../..");

/** Charge .env racine + apps/web/.env.local (server actions / Turbopack). */
export function ensureServerEnv(): void {
  if (loaded) return;

  loadEnvConfig(rootDir);
  loadEnvConfig(webDir);

  loaded = true;
}

export function getServiceRoleKey(): string {
  ensureServerEnv();
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
}

export function getSupabaseUrl(): string {
  ensureServerEnv();
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
}
