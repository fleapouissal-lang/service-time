import type { Profile, ProfileRole, ServiceRequest } from "@service-time/types";
import { requireProfile } from "@/lib/auth";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { fetchAllRows } from "@/lib/supabase-batch";

export type UserRoleStats = {
  clients: number;
  technicians: number;
  admins: number;
  activeClients: number;
  activeTechnicians: number;
  activeAdmins: number;
  total: number;
};

async function requireAdminDb() {
  const profile = await requireProfile(["admin"]);
  if (!profile) {
    throw new Error("غير مصرح");
  }

  const admin = getAdminSupabaseClient();
  if (!admin) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY مطلوب لقراءة إحصائيات لوحة التحكم.",
    );
  }

  return admin;
}

export async function getAdminServiceRequests(): Promise<ServiceRequest[]> {
  const admin = await requireAdminDb();
  return fetchAllRows<ServiceRequest>((from, to) =>
    admin
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, to),
  );
}

export async function getUserRoleStats(): Promise<UserRoleStats> {
  const admin = await requireAdminDb();
  const rows = await fetchAllRows<Pick<Profile, "role" | "is_active">>(
    (from, to) =>
      admin
        .from("profiles")
        .select("role, is_active")
        .order("id")
        .range(from, to),
  );
  return buildUserRoleStats(rows);
}

/** Derives role counts from rows already loaded (avoids a second query). */
export function buildUserRoleStats(
  rows: Pick<Profile, "role" | "is_active">[],
): UserRoleStats {
  const stats: UserRoleStats = {
    clients: 0,
    technicians: 0,
    admins: 0,
    activeClients: 0,
    activeTechnicians: 0,
    activeAdmins: 0,
    total: rows.length,
  };

  for (const row of rows) {
    const role = row.role as ProfileRole;
    const active = row.is_active === true;

    if (role === "client") {
      stats.clients += 1;
      if (active) stats.activeClients += 1;
    } else if (role === "technician") {
      stats.technicians += 1;
      if (active) stats.activeTechnicians += 1;
    } else if (role === "admin") {
      stats.admins += 1;
      if (active) stats.activeAdmins += 1;
    }
  }

  return stats;
}

export async function getPlatformUsers(
  role?: ProfileRole | "all",
): Promise<Profile[]> {
  const admin = await requireAdminDb();
  return fetchAllRows<Profile>((from, to) => {
    let query = admin
      .from("profiles")
      .select("*")
      .order("full_name")
      .order("id");
    if (role && role !== "all") {
      query = query.eq("role", role);
    }
    return query.range(from, to);
  });
}

export async function getPlatformUserById(id: string): Promise<Profile | null> {
  const admin = await requireAdminDb();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as Profile | null) ?? null;
}

export function buildUserRoleChartData(
  stats: UserRoleStats,
): { key: string; name: string; value: number }[] {
  return [
    { key: "client", name: "عملاء", value: stats.clients },
    { key: "technician", name: "فنيون", value: stats.technicians },
    { key: "admin", name: "مديرون", value: stats.admins },
  ].filter((item) => item.value > 0);
}
