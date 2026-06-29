#!/usr/bin/env node
/** Applique les migrations client_vehicles */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(rootDir, ".env") });

const DATABASE_URL =
  process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? "";

const migrationFiles = [
  "20260621120000_client_vehicles.sql",
  "20260709120000_client_vehicles_details.sql",
];

const skipCodes = new Set(["42P07", "42701", "42710", "42P16"]);

async function main() {
  if (!DATABASE_URL) {
    console.error(
      "❌ DATABASE_URL manquant — exécute les SQL dans Supabase SQL Editor:\n" +
        migrationFiles
          .map((file) => join(rootDir, "supabase", "migrations", file))
          .join("\n"),
    );
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    for (const file of migrationFiles) {
      const sqlPath = join(rootDir, "supabase", "migrations", file);
      try {
        await client.query(readFileSync(sqlPath, "utf8"));
        console.log(`✅ ${file} appliquée.`);
      } catch (error) {
        if (skipCodes.has(error.code)) {
          console.log(`↷ ${file} déjà appliquée (${error.message}).`);
          continue;
        }
        throw error;
      }
    }
    console.log("✅ Migrations client_vehicles terminées.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
