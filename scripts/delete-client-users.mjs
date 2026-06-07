#!/usr/bin/env node
/**
 * Supprime tous les utilisateurs avec role = client (+ avatars Storage).
 *
 * Usage:
 *   node scripts/delete-client-users.mjs          # aperçu
 *   node scripts/delete-client-users.mjs --confirm
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

dotenv.config({ path: join(rootDir, ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const AVATAR_BUCKET = "profile-avatars";

const confirm = process.argv.includes("--confirm");

function restHeaders(extra = {}) {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function fetchClients() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?role=eq.client&select=id,full_name,phone`,
    { headers: restHeaders() },
  );
  if (!res.ok) throw new Error(`profiles: ${await res.text()}`);
  return res.json();
}

async function listAvatarPaths(userId) {
  const prefix = encodeURIComponent(`${userId}/`);
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/list/${AVATAR_BUCKET}?prefix=${prefix}`,
    { headers: restHeaders() },
  );
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 404) return [];
    throw new Error(`storage list ${userId}: ${text}`);
  }
  const items = await res.json();
  if (!Array.isArray(items)) return [];
  return items.map((item) => `${userId}/${item.name}`);
}

async function removeStoragePaths(paths) {
  if (paths.length === 0) return;

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${AVATAR_BUCKET}`,
    {
      method: "DELETE",
      headers: restHeaders(),
      body: JSON.stringify({ prefixes: paths }),
    },
  );

  if (!res.ok) {
    throw new Error(`storage delete: ${await res.text()}`);
  }
}

async function deleteAuthUser(userId) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: restHeaders(),
  });

  if (!res.ok) {
    throw new Error(`delete user ${userId}: ${await res.text()}`);
  }
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(
      "❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env",
    );
    process.exit(1);
  }

  const clients = await fetchClients();

  if (clients.length === 0) {
    console.log("✅ Aucun profil client à supprimer.");
    return;
  }

  console.log(`Clients trouvés: ${clients.length}`);
  for (const c of clients) {
    console.log(`  - ${c.full_name} (${c.id}) ${c.phone ?? ""}`);
  }

  if (!confirm) {
    console.log("");
    console.log("⚠️  Aperçu seulement. Pour supprimer:");
    console.log("   node scripts/delete-client-users.mjs --confirm");
    return;
  }

  console.log("");
  console.log("→ Suppression des avatars…");

  for (const c of clients) {
    try {
      const paths = await listAvatarPaths(c.id);
      if (paths.length > 0) {
        await removeStoragePaths(paths);
        console.log(`   ✓ Storage ${c.id}: ${paths.length} fichier(s)`);
      }
    } catch (err) {
      console.warn(`   ⚠ Storage ${c.id}: ${err.message}`);
    }
  }

  console.log("→ Suppression des comptes Auth…");

  for (const c of clients) {
    await deleteAuthUser(c.id);
    console.log(`   ✓ Supprimé: ${c.full_name}`);
  }

  console.log("");
  console.log(`✅ ${clients.length} compte(s) client supprimé(s).`);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
