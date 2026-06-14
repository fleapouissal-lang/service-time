import { PROFILE_AVATAR_BUCKET } from "@/lib/profile-avatar-constants";

const PUBLIC_PATH = `/storage/v1/object/public/${PROFILE_AVATAR_BUCKET}/`;

export function profileAvatarStoragePathFromUrl(
  avatarUrl: string | null | undefined,
): string | null {
  if (!avatarUrl?.trim()) return null;

  const trimmed = avatarUrl.trim();

  if (!trimmed.includes("://") && !trimmed.startsWith("/")) {
    return trimmed.replace(/^\/+/, "");
  }

  try {
    const parsed = new URL(trimmed, "http://local");
    const pathname = parsed.pathname;
    const publicIdx = pathname.indexOf(PUBLIC_PATH);
    if (publicIdx !== -1) {
      return decodeURIComponent(pathname.slice(publicIdx + PUBLIC_PATH.length));
    }
  } catch {
    return null;
  }

  return null;
}

export function getProfileAvatarApiUrl(
  userId: string,
  version?: string | null,
): string {
  const params = new URLSearchParams({ userId });
  if (version) {
    params.set("v", version);
  }
  return `/api/profile-avatar?${params.toString()}`;
}

export function resolveProfileAvatarSrc(
  userId: string,
  avatarUrl?: string | null,
  version?: string | null,
): string | null {
  if (!avatarUrl?.trim() && !userId) return null;
  return getProfileAvatarApiUrl(userId, version);
}

export function contentTypeForAvatarPath(storagePath: string): string {
  const ext = storagePath.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}
