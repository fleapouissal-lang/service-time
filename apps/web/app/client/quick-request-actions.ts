"use server";

import { requireProfileOrThrow } from "@/lib/auth";
import { getQuickRequestPhotoSignedUrl } from "@/lib/quick-request-photo";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export async function getClientQuickRequestPhotoUrlAction(
  requestId: string,
  storagePath: string,
): Promise<{ url: string } | { error: string }> {
  const profile = await requireProfileOrThrow(["client"]);

  const id = String(requestId ?? "").trim();
  const path = String(storagePath ?? "").trim();
  if (!id || !path) {
    return { error: "Invalid request." };
  }

  const admin = getAdminSupabaseClient();
  if (!admin) {
    return { error: "Server configuration is incomplete." };
  }

  const { data, error } = await admin
    .from("quick_requests")
    .select("id, client_id, photo_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return { error: "Request not found." };
  }

  if (data.client_id !== profile.id || data.photo_storage_path !== path) {
    return { error: "Unauthorized." };
  }

  const url = await getQuickRequestPhotoSignedUrl(path, 3600, id);
  if (!url) {
    return { error: "Could not load photo." };
  }

  return { url };
}
