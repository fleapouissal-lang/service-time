#!/usr/bin/env node
/**
 * Crée / met à jour la RPC create_service_request (+ lat/lng).
 *
 * Usage : node scripts/apply-create-service-request-rpc.mjs
 * Ou SQL Editor : supabase/migrations/20260630200000_fix_create_service_request_raise.sql
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(rootDir, ".env") });

const DATABASE_URL =
  process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? "";

const sqlPath = join(
  rootDir,
  "supabase",
  "migrations",
  "20260630200000_fix_create_service_request_raise.sql",
);

async function main() {
  if (!DATABASE_URL) {
    console.error(
      "❌ DATABASE_URL manquant — exécute le SQL dans Supabase SQL Editor :\n" +
        sqlPath,
    );
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    await client.query(readFileSync(sqlPath, "utf8"));
    console.log("✅ RPC create_service_request installée.");
    console.log("   Attends ~10 s puis réessaie « nv demande » dans le dashboard client.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
