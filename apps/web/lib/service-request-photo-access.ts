import type { Profile } from "@service-time/types";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export async function canAccessServiceRequestPhotos(
  profile: Profile,
  requestId: string,
): Promise<boolean> {
  const admin = getAdminSupabaseClient();
  if (!admin) return false;

  const { data, error } = await admin
    .from("service_requests")
    .select("id, client_id, assigned_technician_id")
    .eq("id", requestId)
    .maybeSingle();

  if (error || !data) return false;

  if (profile.role === "admin") return true;

  if (profile.role === "client" && data.client_id === profile.id) {
    return true;
  }

  if (
    profile.role === "technician" &&
    data.assigned_technician_id === profile.id
  ) {
    return true;
  }

  return false;
}
