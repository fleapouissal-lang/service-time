#!/usr/bin/env node
/**
 * Migration inscription client (2 étapes — enum puis tables).
 *
 * Usage : node scripts/apply-client-registration.mjs
 * Ou dans Supabase SQL Editor, exécuter les 2 fichiers l'un après l'autre.
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

const steps = [
  {
    label: "enum profile_role + client",
    file: "20260607120000_client_registration_enum.sql",
  },
  {
    label: "client_verification_codes + contrainte profiles",
    file: "20260607120001_client_registration.sql",
  },
];

async function runStep(relativePath) {
  const sqlPath = join(rootDir, "supabase", "migrations", relativePath);
  const sql = readFileSync(sqlPath, "utf8");
  const client = new pg.Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    await client.query(sql);
  } finally {
    await client.end();
  }
}

async function main() {
  if (!DATABASE_URL) {
    console.error(
      "❌ DATABASE_URL manquant — exécute dans Supabase SQL Editor (2 requêtes séparées) :\n" +
        "  1. supabase/migrations/20260607120000_client_registration_enum.sql\n" +
        "  2. supabase/migrations/20260607120001_client_registration.sql",
    );
    process.exit(1);
  }

  for (const step of steps) {
    console.log(`→ ${step.label}…`);
    await runStep(step.file);
  }

  console.log("✅ Migration inscription client terminée.");
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
