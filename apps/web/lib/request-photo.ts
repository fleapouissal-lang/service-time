import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export const REQUEST_PHOTO_BUCKET = "request-photos";

function contentTypeForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

export async function downloadRequestPhoto(
  storagePath: string,
): Promise<{ buffer: ArrayBuffer; contentType: string; filename: string } | null> {
  const admin = getAdminSupabaseClient();
  if (!admin) return null;

  const path = storagePath.trim().replace(/^\/+/, "");
  if (!path) return null;

  const { data, error } = await admin.storage
    .from(REQUEST_PHOTO_BUCKET)
    .download(path);

  if (error || !data) {
    console.error("[request-photo] download:", error?.message);
    return null;
  }

  return {
    buffer: await data.arrayBuffer(),
    contentType: contentTypeForPath(path),
    filename: path.split("/").pop() ?? "photo.jpg",
  };
}

export async function removeRequestPhoto(storagePath: string): Promise<void> {
  const admin = getAdminSupabaseClient();
  if (!admin) return;

  const path = storagePath.trim().replace(/^\/+/, "");
  if (!path) return;

  const { error } = await admin.storage.from(REQUEST_PHOTO_BUCKET).remove([path]);
  if (error) {
    console.error("[request-photo] remove:", error.message);
  }
}
