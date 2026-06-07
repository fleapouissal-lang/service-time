import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "spare-parts");
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function saveSparePartImage(file: File): Promise<string> {
  if (!file.size) {
    throw new Error("ملف الصورة فارغ");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("حجم الصورة يجب أن لا يتجاوز 5 ميغابايت");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("نوع الصورة غير مدعوم (JPG, PNG, WebP, GIF)");
  }

  const ext = path.extname(file.name).toLowerCase() || ".jpg";
  const base = path
    .basename(file.name, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .slice(0, 48);
  const filename = `${base || "part"}-${Date.now()}${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(bytes));

  return `/spare-parts/${filename}`;
}

export async function saveSparePartImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    if (file.size > 0) {
      urls.push(await saveSparePartImage(file));
    }
  }
  return urls;
}

export async function resolveSparePartImagesFromForm(
  formData: FormData,
): Promise<string[]> {
  const existingRaw = String(formData.get("existing_images") ?? "[]").trim();
  let kept: string[] = [];
  try {
    kept = normalizeJsonImageList(JSON.parse(existingRaw));
  } catch {
    kept = [];
  }

  const legacyImg = String(formData.get("existing_img") ?? "").trim();
  if (kept.length === 0 && legacyImg) {
    kept = [legacyImg];
  }

  const newFiles = formData
    .getAll("new_images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const uploaded = await saveSparePartImages(newFiles);
  return [...kept, ...uploaded];
}

function normalizeJsonImageList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is string => typeof item === "string" && item.trim() !== "",
  );
}
