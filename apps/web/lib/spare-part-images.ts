import type { SparePart } from "@service-time/types";

export function normalizeSparePartImages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string" && item.trim() !== "");
}

/** Cover image + full gallery (deduplicated, cover first). */
export function getSparePartImages(
  part: Pick<SparePart, "img" | "images">,
): string[] {
  const fromColumn = normalizeSparePartImages(part.images);
  if (fromColumn.length > 0) return fromColumn;
  if (part.img?.trim()) return [part.img.trim()];
  return [];
}

export function getSparePartCoverImage(
  part: Pick<SparePart, "img" | "images">,
): string | null {
  const images = getSparePartImages(part);
  return images[0] ?? null;
}
