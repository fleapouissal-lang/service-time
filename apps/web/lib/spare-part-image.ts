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
