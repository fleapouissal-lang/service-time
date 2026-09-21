import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { LegalPageCopy } from "@/components/legal/legal-page-content";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import {
  createLegalPageId,
  createLegalSectionId,
  slugifyLegalSlug,
  textareaToParagraphs,
  type AdminLegalPage,
  type AdminLegalSection,
} from "@/lib/legal-pages-shared";

export type { AdminLegalPage, AdminLegalSection } from "@/lib/legal-pages-shared";
export {
  createLegalPageId,
  createLegalSectionId,
  paragraphsToTextarea,
  slugifyLegalSlug,
  textareaToParagraphs,
} from "@/lib/legal-pages-shared";

export const LEGAL_PAGES_SITE_CONTENT_KEY = "site.legal_pages";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asBool(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (value === "on" || value === "true" || value === 1 || value === "1") {
    return true;
  }
  if (value === "off" || value === "false" || value === 0 || value === "0") {
    return false;
  }
  return fallback;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function fromLocaleCopy(
  slug: string,
  ar: LegalPageCopy,
  en: LegalPageCopy,
  sort_order: number,
): AdminLegalPage {
  const sectionCount = Math.max(ar.sections.length, en.sections.length);
  const sections: AdminLegalSection[] = [];
  for (let i = 0; i < sectionCount; i += 1) {
    const arSection = ar.sections[i];
    const enSection = en.sections[i];
    sections.push({
      id: `${slug}-section-${i + 1}`,
      title_ar: arSection?.title ?? "",
      title_en: enSection?.title ?? "",
      paragraphs_ar: [...(arSection?.paragraphs ?? [])],
      paragraphs_en: [...(enSection?.paragraphs ?? [])],
    });
  }

  return {
    id: slug,
    slug,
    eyebrow_ar: ar.eyebrow,
    eyebrow_en: en.eyebrow,
    title_ar: ar.title,
    title_en: en.title,
    intro_ar: ar.intro,
    intro_en: en.intro,
    sections,
    sort_order,
    is_active: true,
  };
}

export function buildDefaultLegalPages(): AdminLegalPage[] {
  const ar = getDictionary("ar").legal;
  const en = getDictionary("en").legal;
  return [
    fromLocaleCopy("privacy", ar.privacy, en.privacy, 0),
    fromLocaleCopy("terms", ar.terms, en.terms, 1),
    fromLocaleCopy("notice", ar.notice, en.notice, 2),
  ];
}

function normalizeSections(raw: unknown): AdminLegalSection[] {
  if (!Array.isArray(raw)) return [];
  const result: AdminLegalSection[] = [];
  for (const [index, item] of raw.entries()) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    result.push({
      id: asString(row.id) || createLegalSectionId(),
      title_ar: asString(row.title_ar),
      title_en: asString(row.title_en),
      paragraphs_ar: asStringList(row.paragraphs_ar),
      paragraphs_en: asStringList(row.paragraphs_en),
    });
    void index;
  }
  return result;
}

function normalizePages(raw: unknown): AdminLegalPage[] | null {
  if (!raw || typeof raw !== "object") return null;
  const list = (raw as { pages?: unknown }).pages;
  if (!Array.isArray(list)) return null;

  const result: AdminLegalPage[] = [];
  for (const [index, item] of list.entries()) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const slug = slugifyLegalSlug(asString(row.slug));
    if (!slug) continue;
    const sortRaw = Number(row.sort_order);
    result.push({
      id: asString(row.id) || createLegalPageId(),
      slug,
      eyebrow_ar: asString(row.eyebrow_ar),
      eyebrow_en: asString(row.eyebrow_en),
      title_ar: asString(row.title_ar),
      title_en: asString(row.title_en),
      intro_ar: asString(row.intro_ar),
      intro_en: asString(row.intro_en),
      sections: normalizeSections(row.sections),
      sort_order: Number.isFinite(sortRaw) ? sortRaw : index,
      is_active: asBool(row.is_active, true),
    });
  }

  return result.sort(
    (a, b) => a.sort_order - b.sort_order || a.slug.localeCompare(b.slug),
  );
}

export async function getAdminLegalPages(): Promise<AdminLegalPage[]> {
  const admin = getAdminSupabaseClient();
  if (!admin) return buildDefaultLegalPages();

  const { data, error } = await admin
    .from("site_content")
    .select("value")
    .eq("key", LEGAL_PAGES_SITE_CONTENT_KEY)
    .maybeSingle();

  if (error || !data?.value) return buildDefaultLegalPages();
  const parsed = normalizePages(data.value);
  if (!parsed || parsed.length === 0) return buildDefaultLegalPages();
  return parsed;
}

export async function persistLegalPages(
  supabase: SupabaseClient,
  pages: AdminLegalPage[],
): Promise<void> {
  const normalized = [...pages]
    .sort((a, b) => a.sort_order - b.sort_order || a.slug.localeCompare(b.slug))
    .map((page, index) => ({ ...page, sort_order: index }));

  const { error } = await supabase.from("site_content").upsert({
    key: LEGAL_PAGES_SITE_CONTENT_KEY,
    value: { pages: normalized },
  });
  if (error) throw new Error(error.message);
}

export function toPublicLegalPageCopy(
  page: AdminLegalPage,
  locale: "ar" | "en",
): LegalPageCopy {
  const isEn = locale === "en";
  return {
    eyebrow: isEn
      ? page.eyebrow_en || page.eyebrow_ar
      : page.eyebrow_ar || page.eyebrow_en,
    title: isEn ? page.title_en || page.title_ar : page.title_ar || page.title_en,
    intro: isEn ? page.intro_en || page.intro_ar : page.intro_ar || page.intro_en,
    sections: page.sections.map((section) => ({
      title: isEn
        ? section.title_en || section.title_ar
        : section.title_ar || section.title_en,
      paragraphs: isEn
        ? section.paragraphs_en.length > 0
          ? section.paragraphs_en
          : section.paragraphs_ar
        : section.paragraphs_ar.length > 0
          ? section.paragraphs_ar
          : section.paragraphs_en,
    })),
  };
}

export async function getPublicLegalPageBySlug(
  slug: string,
  locale: "ar" | "en",
): Promise<{ page: AdminLegalPage; copy: LegalPageCopy } | null> {
  const normalized = slugifyLegalSlug(slug);
  if (!normalized) return null;
  const pages = await getAdminLegalPages();
  const page = pages.find((item) => item.slug === normalized && item.is_active);
  if (!page) return null;
  return { page, copy: toPublicLegalPageCopy(page, locale) };
}

export async function getActiveLegalSitemapPaths(): Promise<string[]> {
  const pages = await getAdminLegalPages();
  return pages
    .filter((page) => page.is_active)
    .map((page) => `/legal/${page.slug}`);
}

export function parseLegalPageFromForm(
  formData: FormData,
  existing?: AdminLegalPage | null,
): AdminLegalPage {
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug =
    slugifyLegalSlug(slugRaw) ||
    existing?.slug ||
    slugifyLegalSlug(String(formData.get("title_en") ?? formData.get("title_ar") ?? "page"));
  const sortRaw = Number.parseInt(String(formData.get("sort_order") ?? ""), 10);

  const sectionIds = formData.getAll("section_id").map(String);
  const sections: AdminLegalSection[] = sectionIds.map((sectionId) => {
    const finalId =
      sectionId.startsWith("new_") || !sectionId
        ? createLegalSectionId()
        : sectionId;
    return {
      id: finalId,
      title_ar: String(formData.get(`section_title_ar_${sectionId}`) ?? "").trim(),
      title_en: String(formData.get(`section_title_en_${sectionId}`) ?? "").trim(),
      paragraphs_ar: textareaToParagraphs(
        String(formData.get(`section_body_ar_${sectionId}`) ?? ""),
      ),
      paragraphs_en: textareaToParagraphs(
        String(formData.get(`section_body_en_${sectionId}`) ?? ""),
      ),
    };
  });

  return {
    id: existing?.id || createLegalPageId(),
    slug,
    eyebrow_ar: String(formData.get("eyebrow_ar") ?? "").trim(),
    eyebrow_en: String(formData.get("eyebrow_en") ?? "").trim(),
    title_ar: String(formData.get("title_ar") ?? "").trim(),
    title_en: String(formData.get("title_en") ?? "").trim(),
    intro_ar: String(formData.get("intro_ar") ?? "").trim(),
    intro_en: String(formData.get("intro_en") ?? "").trim(),
    sections,
    sort_order: Number.isFinite(sortRaw)
      ? sortRaw
      : (existing?.sort_order ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

export function validateLegalPage(
  page: AdminLegalPage,
  allPages: AdminLegalPage[],
  existingId?: string,
): string | null {
  if (!page.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug)) {
    return "slug_invalid";
  }
  if (
    allPages.some(
      (item) => item.slug === page.slug && item.id !== (existingId || page.id),
    )
  ) {
    return "slug_taken";
  }
  if (page.title_ar.length < 2 && page.title_en.length < 2) {
    return "title_required";
  }
  if (page.sections.length < 1) return "section_required";
  if (
    page.sections.some(
      (section) =>
        section.title_ar.length < 1 &&
        section.title_en.length < 1 &&
        section.paragraphs_ar.length < 1 &&
        section.paragraphs_en.length < 1,
    )
  ) {
    return "section_empty";
  }
  return null;
}
