#!/usr/bin/env node
/**
 * Crée / met à jour la table quick_requests (demandes rapides).
 *
 * Usage : node scripts/apply-quick-requests.mjs
 * Ou exécute les fichiers SQL dans Supabase SQL Editor.
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

const migrationFiles = [
  "20260617120000_quick_requests.sql",
  "20260618120000_quick_requests_client_id.sql",
  "20260701120000_quick_request_photos_bucket.sql",
  "20260702120000_quick_requests_admin_read_at.sql",
];

async function main() {
  if (!DATABASE_URL) {
    console.error(
      "❌ DATABASE_URL manquant — exécute les migrations dans Supabase SQL Editor :\n" +
        migrationFiles
          .map((file) => join(rootDir, "supabase", "migrations", file))
          .join("\n"),
    );
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();

    for (const file of migrationFiles) {
      const sqlPath = join(rootDir, "supabase", "migrations", file);
      const sql = readFileSync(sqlPath, "utf8");
      await client.query(sql);
      console.log(`✅ ${file}`);
    }

    console.log("✅ quick_requests + bucket quick-request-photos prêts.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
