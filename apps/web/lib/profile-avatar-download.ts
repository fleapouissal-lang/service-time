import type { SupabaseClient } from "@supabase/supabase-js";
import "server-only";
import {
  contentTypeForAvatarPath,
  profileAvatarStoragePathFromUrl,
} from "@/lib/profile-avatar-url";
import { PROFILE_AVATAR_BUCKET } from "@/lib/profile-avatar-constants";

export type ProfileAvatarRecord = {
  avatar_url: string | null;
  avatar_storage_path?: string | null;
};

export async function downloadProfileAvatar(
  admin: SupabaseClient,
  profile: ProfileAvatarRecord,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const storagePath =
    profile.avatar_storage_path?.trim() ||
    profileAvatarStoragePathFromUrl(profile.avatar_url);

  if (storagePath) {
    const { data, error } = await admin.storage
      .from(PROFILE_AVATAR_BUCKET)
      .download(storagePath);

    if (!error && data) {
      return {
        buffer: Buffer.from(await data.arrayBuffer()),
        contentType: contentTypeForAvatarPath(storagePath),
      };
    }
  }

  const avatarUrl = profile.avatar_url?.trim();
  if (!avatarUrl) return null;

  try {
    const response = await fetch(avatarUrl, { cache: "no-store" });
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType =
      response.headers.get("content-type")?.split(";")[0]?.trim() ||
      (storagePath
        ? contentTypeForAvatarPath(storagePath)
        : "image/jpeg");

    return { buffer, contentType };
  } catch {
    return null;
  }
}
