#!/usr/bin/env node
/**
 * Crée la table contact_messages.
 *
 * Usage : node scripts/apply-contact-table.mjs
 * Ou exécute supabase/migrations/20260605140000_contact_messages.sql dans SQL Editor.
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
  "20260605140000_contact_messages.sql",
);

async function main() {
  if (!DATABASE_URL) {
    console.error(
      "❌ DATABASE_URL manquant — exécute le SQL dans Supabase SQL Editor :\n" +
        sqlPath,
    );
    process.exit(1);
  }

  const sql = readFileSync(sqlPath, "utf8");
  const client = new pg.Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    await client.query(sql);
    console.log("✅ Table contact_messages créée.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
