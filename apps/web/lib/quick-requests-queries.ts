import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export type QuickRequestRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  photo_storage_path: string | null;
  client_id: string | null;
  admin_read_at: string | null;
  created_at: string;
};

export async function getAdminQuickRequests(): Promise<QuickRequestRow[]> {
  const admin = getAdminSupabaseClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("quick_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[quick-requests] admin list:", error.message, error.code);
    return [];
  }

  return (data as QuickRequestRow[]) ?? [];
}

export async function getClientQuickRequests(
  clientId: string,
): Promise<QuickRequestRow[]> {
  const admin = getAdminSupabaseClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("quick_requests")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[quick-requests] client list:", error.message, error.code);
    return [];
  }

  return (data as QuickRequestRow[]) ?? [];
}
