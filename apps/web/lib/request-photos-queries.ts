import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export type RequestPhotoRow = {
  id: string;
  request_id: string;
  storage_path: string;
  created_at: string;
};

export async function getRequestPhotos(
  requestId: string,
): Promise<RequestPhotoRow[]> {
  const admin = getAdminSupabaseClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("request_photos")
    .select("id, request_id, storage_path, created_at")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[request-photos] list:", error.message);
    return [];
  }

  return (data as RequestPhotoRow[]) ?? [];
}

export async function getRequestPhotoCounts(
  requestIds: string[],
): Promise<Record<string, number>> {
  const admin = getAdminSupabaseClient();
  if (!admin || requestIds.length === 0) return {};

  const { data, error } = await admin
    .from("request_photos")
    .select("request_id")
    .in("request_id", requestIds);

  if (error) {
    console.error("[request-photos] counts:", error.message);
    return {};
  }

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = row.request_id as string;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}
