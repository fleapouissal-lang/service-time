#!/usr/bin/env node
/**
 * Crée un compte admin (Supabase Auth + public.profiles).
 *
 * Usage:
 *   node scripts/create-admin.mjs fleapouissal@gmail.com
 *   node scripts/create-admin.mjs fleapouissal@gmail.com "MonMotDePasse123!"
 *
 * Prérequis .env :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

dotenv.config({ path: join(rootDir, ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3] ?? "Admin123!";
const fullName = process.argv[4] ?? "مدير النظام";

function restHeaders(extra = {}) {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function supabaseRest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: restHeaders(options.headers),
  });
  if (!res.ok) {
    throw new Error(`${path}: ${await res.text()}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function findUserByEmail(targetEmail) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=200`,
    { headers: restHeaders() },
  );
  if (!res.ok) throw new Error(`List users failed: ${await res.text()}`);
  const body = await res.json();
  return (body.users ?? []).find((u) => u.email === targetEmail) ?? null;
}

async function createAuthUser(userId, targetEmail, targetPassword) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: restHeaders(),
    body: JSON.stringify({
      id: userId,
      email: targetEmail,
      password: targetPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    }),
  });

  if (res.ok) return res.json();

  const errText = await res.text();
  if (errText.includes("already been registered") || res.status === 422) {
    const existing = await findUserByEmail(targetEmail);
    if (existing) return existing;
  }
  throw new Error(`Create user ${targetEmail}: ${errText}`);
}

async function main() {
  if (!email) {
    console.error("Usage: node scripts/create-admin.mjs <email> [password] [full_name]");
    process.exit(1);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(
      "❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env",
    );
    process.exit(1);
  }

  const existing = await findUserByEmail(email);
  const userId = existing?.id ?? randomUUID();

  console.log(`👤 Création admin: ${email}`);
  const authUser = await createAuthUser(userId, email, password);
  const finalId = authUser.id ?? userId;
  console.log(`   ✓ Auth user: ${finalId}`);

  await supabaseRest("/profiles?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify([
      {
        id: finalId,
        full_name: fullName,
        phone: null,
        role: "admin",
        technician_type: null,
        is_active: true,
      },
    ]),
  });

  console.log("   ✓ Profile admin créé/mis à jour");
  console.log("");
  console.log("✅ Compte prêt — connecte-toi sur /login");
  console.log(`   Email    : ${email}`);
  console.log(`   Password : ${password}`);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
