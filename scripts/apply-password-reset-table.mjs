#!/usr/bin/env node
/**
 * Crée la table password_reset_codes (migration oubliée).
 *
 * Prérequis .env :
 *   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
 *
 * Usage :
 *   node scripts/apply-password-reset-table.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

dotenv.config({ path: join(rootDir, ".env") });

const DATABASE_URL =
  process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? "";

const sqlPath = join(
  rootDir,
  "supabase",
  "migrations",
  "20260606120000_password_reset_codes.sql",
);

async function main() {
  if (!DATABASE_URL) {
    console.error(
      "❌ DATABASE_URL manquant dans .env\n" +
        "   Supabase → Project Settings → Database → Connection string (URI)\n" +
        "   Ou exécute le SQL manuellement dans SQL Editor :\n" +
        `   ${sqlPath}`,
    );
    process.exit(1);
  }

  const sql = readFileSync(sqlPath, "utf8");
  const client = new pg.Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    await client.query(sql);
    console.log("✅ Table password_reset_codes créée.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
