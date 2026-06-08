#!/usr/bin/env node
/** Applique le suivi GPS technicien (RPC + Realtime) */

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
  "20260620120000_technician_location_tracking.sql",
  "20260620130000_technician_location_realtime.sql",
];

async function main() {
  if (!DATABASE_URL) {
    console.error(
      "❌ DATABASE_URL manquant dans .env\n\n" +
        "   1. Supabase → Project Settings → Database → Connection string (URI)\n" +
        "   2. Ajoutez dans .env : DATABASE_URL=postgresql://postgres:...@db....supabase.co:5432/postgres\n" +
        "   3. Relancez : npm run db:technician-location\n\n" +
        "   Ou copiez-collez les fichiers SQL dans Supabase → SQL Editor :\n" +
        migrationFiles.map((f) => `   - supabase/migrations/${f}`).join("\n"),
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
      console.log(`📦 ${file}…`);
      await client.query(readFileSync(sqlPath, "utf8"));
    }
    console.log("✅ Suivi GPS technicien appliqué (RPC + Realtime).");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
