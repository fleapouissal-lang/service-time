/** Types + helpers safe for client and server (no Node/fs). */

export type AdminLegalSection = {
  id: string;
  title_ar: string;
  title_en: string;
  paragraphs_ar: string[];
  paragraphs_en: string[];
};

export type AdminLegalPage = {
  id: string;
  slug: string;
  eyebrow_ar: string;
  eyebrow_en: string;
  title_ar: string;
  title_en: string;
  intro_ar: string;
  intro_en: string;
  sections: AdminLegalSection[];
  sort_order: number;
  is_active: boolean;
};

export function createLegalPageId(): string {
  return crypto.randomUUID();
}

export function createLegalSectionId(): string {
  return crypto.randomUUID();
}

export function slugifyLegalSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function paragraphsToTextarea(paragraphs: string[]): string {
  return paragraphs.join("\n\n");
}

export function textareaToParagraphs(raw: string): string[] {
  return raw
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}
