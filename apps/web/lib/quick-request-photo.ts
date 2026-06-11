import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export const QUICK_REQUEST_PHOTO_BUCKET = "quick-request-photos";

const LEGACY_BUCKET = "request-photos";

export type QuickRequestPhotoLocation = {
  bucket: string;
  path: string;
};

function contentTypeForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

/** Anciens chemins `quick/{id}/…` étaient dans request-photos. */
export function resolveQuickRequestPhotoBucket(storagePath: string): string {
  if (storagePath.startsWith("quick/")) {
    return LEGACY_BUCKET;
  }
  return QUICK_REQUEST_PHOTO_BUCKET;
}

export function buildQuickRequestPhotoCandidates(
  storagePath: string,
  requestId?: string,
): QuickRequestPhotoLocation[] {
  const raw = storagePath.trim().replace(/^\/+/, "");
  const seen = new Set<string>();
  const candidates: QuickRequestPhotoLocation[] = [];

  const add = (bucket: string, path: string) => {
    const normalizedPath = path.trim().replace(/^\/+/, "");
    if (!normalizedPath) return;
    const key = `${bucket}:${normalizedPath}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ bucket, path: normalizedPath });
  };

  if (raw.startsWith(`${QUICK_REQUEST_PHOTO_BUCKET}/`)) {
    add(
      QUICK_REQUEST_PHOTO_BUCKET,
      raw.slice(QUICK_REQUEST_PHOTO_BUCKET.length + 1),
    );
  }
  if (raw.startsWith(`${LEGACY_BUCKET}/`)) {
    add(LEGACY_BUCKET, raw.slice(LEGACY_BUCKET.length + 1));
  }

  add(resolveQuickRequestPhotoBucket(raw), raw);

  if (raw.startsWith("quick/")) {
    add(LEGACY_BUCKET, raw);
    add(QUICK_REQUEST_PHOTO_BUCKET, raw.slice("quick/".length));
  } else {
    add(QUICK_REQUEST_PHOTO_BUCKET, raw);
    if (requestId) {
      add(LEGACY_BUCKET, `quick/${raw}`);
      if (raw.startsWith(`${requestId}/`)) {
        add(LEGACY_BUCKET, `quick/${raw}`);
      }
    }
  }

  return candidates;
}

async function quickRequestPhotoExists(
  location: QuickRequestPhotoLocation,
): Promise<boolean> {
  const admin = getAdminSupabaseClient();
  if (!admin) return false;

  const parts = location.path.split("/");
  const name = parts.pop();
  if (!name) return false;

  const folder = parts.join("/");
  const { data, error } = await admin.storage.from(location.bucket).list(folder, {
    limit: 20,
    search: name,
  });

  if (error) {
    return false;
  }

  return (data ?? []).some((entry) => entry.name === name);
}

export async function resolveQuickRequestPhotoLocation(
  storagePath: string,
  requestId?: string,
): Promise<QuickRequestPhotoLocation | null> {
  for (const candidate of buildQuickRequestPhotoCandidates(storagePath, requestId)) {
    if (await quickRequestPhotoExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

export async function downloadQuickRequestPhoto(
  storagePath: string,
  requestId?: string,
): Promise<{ buffer: ArrayBuffer; contentType: string; filename: string } | null> {
  const admin = getAdminSupabaseClient();
  if (!admin) return null;

  const location = await resolveQuickRequestPhotoLocation(storagePath, requestId);
  if (!location) return null;

  const { data, error } = await admin.storage
    .from(location.bucket)
    .download(location.path);

  if (error || !data) {
    console.error("[quick-request-photo] download:", error?.message);
    return null;
  }

  const filename = location.path.split("/").pop() ?? "photo.jpg";

  return {
    buffer: await data.arrayBuffer(),
    contentType: contentTypeForPath(location.path),
    filename,
  };
}

export async function getQuickRequestPhotoSignedUrl(
  storagePath: string,
  expiresIn = 3600,
  requestId?: string,
): Promise<string | null> {
  const admin = getAdminSupabaseClient();
  if (!admin) return null;

  const location = await resolveQuickRequestPhotoLocation(storagePath, requestId);
  if (!location) {
    console.error("[quick-request-photo] signed url: object not found");
    return null;
  }

  const { data, error } = await admin.storage
    .from(location.bucket)
    .createSignedUrl(location.path, expiresIn);

  if (error || !data?.signedUrl) {
    console.error("[quick-request-photo] signed url:", error?.message);
    return null;
  }

  return data.signedUrl;
}

export async function removeQuickRequestPhoto(
  storagePath: string,
  requestId?: string,
): Promise<void> {
  const admin = getAdminSupabaseClient();
  if (!admin) return;

  for (const candidate of buildQuickRequestPhotoCandidates(storagePath, requestId)) {
    const { error } = await admin.storage.from(candidate.bucket).remove([candidate.path]);
    if (!error) {
      return;
    }
  }

  console.error("[quick-request-photo] remove: object not found");
}
