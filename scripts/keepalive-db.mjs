#!/usr/bin/env node
/**
 * Keep-alive Supabase (Free tier) : insert une ligne puis la supprime.
 * Usage (cron) : node scripts/keepalive-db.mjs
 *
 * Prérequis .env :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
const KEY = "system.keepalive";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

const stamp = new Date().toISOString();

const upsert = await fetch(`${SUPABASE_URL}/rest/v1/site_content?on_conflict=key`, {
  method: "POST",
  headers: {
    ...headers,
    Prefer: "resolution=merge-duplicates,return=minimal",
  },
  body: JSON.stringify({
    key: KEY,
    value: { ping: stamp, source: "keepalive-cron" },
  }),
});

if (!upsert.ok) {
  console.error("Insert failed:", upsert.status, await upsert.text());
  process.exit(1);
}

const del = await fetch(
  `${SUPABASE_URL}/rest/v1/site_content?key=eq.${encodeURIComponent(KEY)}`,
  { method: "DELETE", headers },
);

if (!del.ok) {
  console.error("Delete failed:", del.status, await del.text());
  process.exit(1);
}

console.log(`[keepalive] ok ${stamp}`);
