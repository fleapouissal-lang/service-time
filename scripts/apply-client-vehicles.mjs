#!/usr/bin/env node
/** Applique la table client_vehicles */

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
  "20260621120000_client_vehicles.sql",
);

async function main() {
  if (!DATABASE_URL) {
    console.error(
      "❌ DATABASE_URL manquant — exécute le SQL dans Supabase SQL Editor:\n" +
        sqlPath,
    );
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(readFileSync(sqlPath, "utf8"));
    console.log("✅ Table client_vehicles appliquée.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
