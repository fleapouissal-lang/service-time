#!/usr/bin/env node
/**
 * Seed Auth users + public.profiles (admin, technicians, clients).
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

/** @typedef {{
 *   id: string;
 *   email: string;
 *   password: string;
 *   full_name: string;
 *   full_name_ar?: string;
 *   full_name_en?: string;
 *   phone: string;
 *   role: "admin" | "technician" | "client";
 *   technician_type: "mobile" | "workshop" | null;
 * }} SeedUser */

/** @type {SeedUser[]} */
const DEMO_USERS = [
  {
    id: "e1000001-0001-4001-8001-000000000001",
    email: "admin@servicetime.sa",
    password: "Admin123!",
    full_name: "مدير النظام",
    full_name_ar: "مدير النظام",
    full_name_en: "System Admin",
    phone: "+966500000001",
    role: "admin",
    technician_type: null,
  },
  {
    id: "e1000001-0001-4001-8001-000000000002",
    email: "tech@servicetime.sa",
    password: "Tech123!",
    full_name: "فهد المتنقل",
    full_name_ar: "فهد المتنقل",
    full_name_en: "Fahd Mobile",
    phone: "+966500000002",
    role: "technician",
    technician_type: "mobile",
  },
  {
    id: "e1000001-0001-4001-8001-000000000003",
    email: "workshop@servicetime.sa",
    password: "Tech123!",
    full_name: "ورشة الجنوب",
    full_name_ar: "ورشة الجنوب",
    full_name_en: "South Workshop",
    phone: "+966500000003",
    role: "technician",
    technician_type: "workshop",
  },
  {
    id: "e1000001-0001-4001-8001-000000000004",
    email: "client@servicetime.sa",
    password: "Client123!",
    full_name: "أحمد العتيبي",
    full_name_ar: "أحمد العتيبي",
    full_name_en: "Ahmed Al-Otaibi",
    phone: "+966501234567",
    role: "client",
    technician_type: null,
  },
  {
    id: "e1000001-0001-4001-8001-000000000005",
    email: "sara@servicetime.sa",
    password: "Client123!",
    full_name: "سارة القحطاني",
    full_name_ar: "سارة القحطاني",
    full_name_en: "Sara Al-Qahtani",
    phone: "+966509876543",
    role: "client",
    technician_type: null,
  },
];

const TECH_MOBILE_ID = DEMO_USERS.find((u) => u.email === "tech@servicetime.sa").id;
const CLIENT_AHMED_ID = DEMO_USERS.find((u) => u.email === "client@servicetime.sa").id;
const CLIENT_SARA_ID = DEMO_USERS.find((u) => u.email === "sara@servicetime.sa").id;

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
      user_metadata: {
        full_name: user.full_name,
        full_name_ar: user.full_name_ar,
        full_name_en: user.full_name_en,
      },
    }),
  });

  if (res.ok) return res.json();

  const errText = await res.text();
  if (errText.includes("already been registered") || res.status === 422) {
    const existing = await findUserByEmail(user.email);
    if (existing) {
      // Keep password in sync for demo re-seed
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existing.id}`, {
        method: "PUT",
        headers: restHeaders(),
        body: JSON.stringify({
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name,
            full_name_ar: user.full_name_ar,
            full_name_en: user.full_name_en,
          },
        }),
      });
      return existing;
    }
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
        full_name_ar: u.full_name_ar ?? u.full_name,
        full_name_en: u.full_name_en ?? null,
        phone: u.phone,
        role: u.role,
        technician_type: u.technician_type,
        is_active: true,
      })),
    ),
  });

  // Link demo requests to clients when present
  await supabaseRest(`/service_requests?tracking_token=eq.demo-rec001`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ client_id: CLIENT_AHMED_ID }),
  }).catch(() => {});

  await supabaseRest(`/service_requests?tracking_token=eq.demo-track-live`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      client_id: CLIENT_SARA_ID,
      assigned_technician_id: TECH_MOBILE_ID,
    }),
  }).catch(() => {});

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
  }).catch(() => {});

  // Demo vehicles for clients
  await supabaseRest("/client_vehicles?on_conflict=client_id,label", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify([
      { client_id: CLIENT_AHMED_ID, label: "تويوتا كامري 2020" },
      { client_id: CLIENT_AHMED_ID, label: "هيونداي توسان 2022" },
      { client_id: CLIENT_SARA_ID, label: "هيونداي توسان 2022" },
    ]),
  }).catch(async () => {
    // Fallback without unique conflict target if schema differs
    for (const vehicle of [
      { client_id: CLIENT_AHMED_ID, label: "تويوتا كامري 2020" },
      { client_id: CLIENT_AHMED_ID, label: "هيونداي توسان 2022" },
      { client_id: CLIENT_SARA_ID, label: "هيونداي توسان 2022" },
    ]) {
      await supabaseRest("/client_vehicles", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(vehicle),
      }).catch(() => {});
    }
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
    console.log(`   ✓ ${user.email} (${user.role}) → ${authUser.id ?? user.id}`);
  }

  console.log("📋 Insertion des profiles + données liées...");
  await upsertProfilesAndDemoData();
  console.log(`   ✓ ${DEMO_USERS.length} profiles créés/mis à jour`);

  console.log("");
  console.log("✅ Comptes seed :");
  console.log("   admin@servicetime.sa      / Admin123!   → /admin");
  console.log("   tech@servicetime.sa       / Tech123!    → /technician (mobile)");
  console.log("   workshop@servicetime.sa   / Tech123!    → /technician (workshop)");
  console.log("   client@servicetime.sa     / Client123!  → /client");
  console.log("   sara@servicetime.sa       / Client123!  → /client");
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
