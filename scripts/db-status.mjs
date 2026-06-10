#!/usr/bin/env node
/** Affiche l'état des migrations et colonnes clés (diagnostic). */
import dotenv from "dotenv";
import pg from "pg";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env") });

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const tables = await client.query(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' ORDER BY 1
`);
console.log("Tables:", tables.rows.map((r) => r.table_name).join(", "));

const quoteCols = await client.query(`
  SELECT column_name FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'service_requests'
    AND column_name IN ('client_proposed_price', 'quote_status', 'agreed_price')
  ORDER BY 1
`);
console.log("Quote columns:", quoteCols.rows.map((r) => r.column_name).join(", ") || "(aucune)");

const applied = await client.query(`
  SELECT filename FROM service_time_schema_migrations ORDER BY filename
`).catch(() => ({ rows: [] }));
console.log("Tracked migrations:", applied.rows.length);

const enumValues = await client.query(`
  SELECT e.enumlabel AS value
  FROM pg_enum e
  INNER JOIN pg_type t ON e.enumtypid = t.oid
  INNER JOIN pg_namespace n ON t.typnamespace = n.oid
  WHERE n.nspname = 'public' AND t.typname = 'request_status'
  ORDER BY e.enumsortorder
`).catch(() => ({ rows: [] }));
console.log(
  "request_status:",
  enumValues.rows.map((r) => r.value).join(", ") || "(type introuvable)",
);
console.log(
  'request_status.assigned:',
  enumValues.rows.some((r) => r.value === "assigned") ? "OK" : "MANQUANT",
);

await client.end();
