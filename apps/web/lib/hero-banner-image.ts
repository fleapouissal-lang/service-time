import { mkdir, writeFile } from "fs/promises";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "hero", "uploads");
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function saveHeroBannerImage(
  file: File,
  slot: string,
): Promise<string> {
  if (!file.size) {
    throw new Error("ملف الصورة فارغ");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("حجم الصورة يجب أن لا يتجاوز 8 ميغابايت");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("نوع الصورة غير مدعوم (JPG, PNG, WebP, GIF)");
  }

  const ext = path.extname(file.name).toLowerCase() || ".png";
  const safeSlot = slot.replace(/[^a-z0-9_-]/gi, "-").slice(0, 40) || "banner";
  const filename = `${safeSlot}-${Date.now()}${ext}`;

  await mkdir(UPLOAD_ROOT, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(path.join(UPLOAD_ROOT, filename), Buffer.from(bytes));

  return `/hero/uploads/${filename}`;
}

export async function resolveHeroBannerImagesFromForm(
  formData: FormData,
  existing?: {
    image_desktop_ar?: string;
    image_desktop_en?: string;
    image_mobile_ar?: string;
    image_mobile_en?: string;
  } | null,
): Promise<{
  image_desktop_ar: string;
  image_desktop_en: string;
  image_mobile_ar: string;
  image_mobile_en: string;
}> {
  const slots = [
    "image_desktop_ar",
    "image_desktop_en",
    "image_mobile_ar",
    "image_mobile_en",
  ] as const;

  const result = {
    image_desktop_ar: existing?.image_desktop_ar ?? "",
    image_desktop_en: existing?.image_desktop_en ?? "",
    image_mobile_ar: existing?.image_mobile_ar ?? "",
    image_mobile_en: existing?.image_mobile_en ?? "",
  };

  for (const slot of slots) {
    const kept = String(formData.get(slot) ?? "").trim();
    if (kept) result[slot] = kept;

    const file = formData.get(`${slot}_file`);
    if (file instanceof File && file.size > 0) {
      result[slot] = await saveHeroBannerImage(file, slot);
    }
  }

  return result;
}
