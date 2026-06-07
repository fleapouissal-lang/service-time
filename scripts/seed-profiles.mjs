#!/usr/bin/env node
/**
 * Crée les comptes Auth + profiles admin/techniciens (démo).
 *
 * Prérequis .env :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage : npm run db:seed-profiles
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

dotenv.config({ path: join(rootDir, ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const DEMO_USERS = [
  {
    id: "e1000001-0001-4001-8001-000000000001",
    email: "admin@servicetime.sa",
    password: "Admin123!",
    full_name: "مدير النظام",
    phone: "+966500000001",
    role: "admin",
    technician_type: null,
  },
  {
    id: "e1000001-0001-4001-8001-000000000002",
    email: "tech@servicetime.sa",
    password: "Tech123!",
    full_name: "فهد المتنقل",
    phone: "+966500000002",
    role: "technician",
    technician_type: "mobile",
  },
  {
    id: "e1000001-0001-4001-8001-000000000003",
    email: "workshop@servicetime.sa",
    password: "Tech123!",
    full_name: "ورشة الجنوب",
    phone: "+966500000003",
    role: "technician",
    technician_type: "workshop",
  },
];

const TECH_MOBILE_ID = DEMO_USERS[1].id;

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

async function findUserByEmail(email) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=200`,
    { headers: restHeaders() },
  );
  if (!res.ok) throw new Error(`List users failed: ${await res.text()}`);
  const body = await res.json();
  return (body.users ?? []).find((u) => u.email === email) ?? null;
}

async function createAuthUser(user) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: restHeaders(),
    body: JSON.stringify({
      id: user.id,
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name },
    }),
  });

  if (res.ok) return res.json();

  const errText = await res.text();
  if (errText.includes("already been registered") || res.status === 422) {
    const existing = await findUserByEmail(user.email);
    if (existing) return existing;
  }
  throw new Error(`Create user ${user.email}: ${errText}`);
}

async function upsertProfilesAndDemoData() {
  await supabaseRest("/profiles?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(
      DEMO_USERS.map((u) => ({
        id: u.id,
        full_name: u.full_name,
        phone: u.phone,
        role: u.role,
        technician_type: u.technician_type,
        is_active: true,
      })),
    ),
  });

  await supabaseRest(
    `/service_requests?tracking_token=eq.demo-track-live`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ assigned_technician_id: TECH_MOBILE_ID }),
    },
  );

  await supabaseRest("/technician_locations?on_conflict=technician_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify([
      {
        technician_id: TECH_MOBILE_ID,
        lat: 24.705,
        lng: 46.67,
        updated_at: new Date().toISOString(),
      },
    ]),
  });
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(
      "❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env",
    );
    process.exit(1);
  }

  console.log("👤 Création des utilisateurs Auth...");
  for (const user of DEMO_USERS) {
    const authUser = await createAuthUser(user);
    console.log(`   ✓ ${user.email} → ${authUser.id ?? user.id}`);
  }

  console.log("📋 Insertion des profiles...");
  await upsertProfilesAndDemoData();
  console.log("   ✓ 3 profiles créés");
  console.log("   ✓ technicien assigné à demo-track-live (si la demande existe)");

  console.log("");
  console.log("✅ Comptes démo :");
  console.log("   admin@servicetime.sa      / Admin123!  → /login → /admin");
  console.log("   tech@servicetime.sa       / Tech123!   → /login → /technician");
  console.log("   workshop@servicetime.sa   / Tech123!   → /login → /technician");
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
