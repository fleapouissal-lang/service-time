#!/usr/bin/env node
/**
 * Migration avatars profil + bucket profile-avatars
 *
 * Usage : node scripts/apply-profile-avatars.mjs
 * Ou exécute supabase/migrations/20260608120000_profile_avatars.sql dans SQL Editor.
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
  "20260608120000_profile_avatars.sql",
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
    console.log("✅ Avatars profil + bucket profile-avatars créés.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
