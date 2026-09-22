import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { CTA_SLIDE_IMAGES, type CtaSlideId } from "@/lib/cta-slides";
import type {
  AdminCtaBanner,
  PublicCtaBanner,
} from "@/lib/cta-banners-shared";

export type {
  AdminCtaBanner,
  PublicCtaBanner,
} from "@/lib/cta-banners-shared";

export const CTA_BANNERS_SITE_CONTENT_KEY = "site.cta_banners";

export function createCtaBannerId(): string {
  return crypto.randomUUID();
}

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

function defaultImageForId(id: string): string {
  const known = CTA_SLIDE_IMAGES[id as CtaSlideId];
  return known?.src.split("?")[0] ?? "/cta/slide-maintenance.png";
}

/** Seed from i18n siteCta slides + built-in CTA images. */
export function buildDefaultCtaBanners(): AdminCtaBanner[] {
  const ar = getDictionary("ar").siteCta.slides;
  const en = getDictionary("en").siteCta.slides;

  return ar.map((slide, index) => {
    const enSlide = en.find((item) => item.id === slide.id) ?? slide;
    const image = defaultImageForId(slide.id);
    return {
      id: slide.id,
      title_before_ar: slide.titleBefore,
      title_before_en: enSlide.titleBefore,
      title_highlight_ar: slide.titleHighlight,
      title_highlight_en: enSlide.titleHighlight,
      description_ar: slide.description,
      description_en: enSlide.description,
      cta_label_ar: slide.ctaLabel,
      cta_label_en: enSlide.ctaLabel,
      href: slide.ctaHref,
      image_ar: image,
      image_en: image,
      sort_order: index,
      is_active: true,
    };
  });
}

function normalizeBanners(raw: unknown): AdminCtaBanner[] | null {
  if (!raw || typeof raw !== "object") return null;
  const list = (raw as { banners?: unknown }).banners;
  if (!Array.isArray(list)) return null;

  const result: AdminCtaBanner[] = [];
  for (const [index, item] of list.entries()) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = asString(row.id) || createCtaBannerId();
    const sortRaw = Number(row.sort_order);
    const imageFallback = defaultImageForId(id);
    result.push({
      id,
      title_before_ar: asString(row.title_before_ar),
      title_before_en: asString(row.title_before_en),
      title_highlight_ar: asString(row.title_highlight_ar),
      title_highlight_en: asString(row.title_highlight_en),
      description_ar: asString(row.description_ar),
      description_en: asString(row.description_en),
      cta_label_ar: asString(row.cta_label_ar),
      cta_label_en: asString(row.cta_label_en),
      href: asString(row.href) || "/request",
      image_ar: asString(row.image_ar) || imageFallback,
      image_en: asString(row.image_en) || imageFallback,
      sort_order: Number.isFinite(sortRaw) ? sortRaw : index,
      is_active: asBool(row.is_active, true),
    });
  }

  return result.sort(
    (a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id),
  );
}

export async function getAdminCtaBanners(): Promise<AdminCtaBanner[]> {
  const admin = getAdminSupabaseClient();
  if (!admin) return buildDefaultCtaBanners();

  const { data, error } = await admin
    .from("site_content")
    .select("value")
    .eq("key", CTA_BANNERS_SITE_CONTENT_KEY)
    .maybeSingle();

  if (error || !data?.value) return buildDefaultCtaBanners();
  const parsed = normalizeBanners(data.value);
  if (!parsed || parsed.length === 0) return buildDefaultCtaBanners();
  return parsed;
}

export async function persistCtaBanners(
  supabase: SupabaseClient,
  banners: AdminCtaBanner[],
): Promise<void> {
  const normalized = banners
    .map((banner, index) => ({
      ...banner,
      href: banner.href.trim() || "/request",
      sort_order: Number.isFinite(banner.sort_order) ? banner.sort_order : index,
    }))
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
    .map((banner, index) => ({ ...banner, sort_order: index }));

  const { error } = await supabase.from("site_content").upsert({
    key: CTA_BANNERS_SITE_CONTENT_KEY,
    value: { banners: normalized },
  });

  if (error) throw new Error(error.message);
}

export function toPublicCtaBanners(
  banners: AdminCtaBanner[],
  locale: "ar" | "en",
): PublicCtaBanner[] {
  const isEn = locale === "en";
  return banners
    .filter((banner) => banner.is_active)
    .map((banner) => ({
      id: banner.id,
      titleBefore: isEn
        ? banner.title_before_en || banner.title_before_ar
        : banner.title_before_ar || banner.title_before_en,
      titleHighlight: isEn
        ? banner.title_highlight_en || banner.title_highlight_ar
        : banner.title_highlight_ar || banner.title_highlight_en,
      description: isEn
        ? banner.description_en || banner.description_ar
        : banner.description_ar || banner.description_en,
      ctaLabel: isEn
        ? banner.cta_label_en || banner.cta_label_ar
        : banner.cta_label_ar || banner.cta_label_en,
      href: banner.href || "/request",
      imageSrc:
        (isEn
          ? banner.image_en || banner.image_ar
          : banner.image_ar || banner.image_en) || defaultImageForId(banner.id),
    }))
    .filter((banner) => Boolean(banner.imageSrc && banner.titleBefore));
}

export async function getPublicCtaBanners(
  locale: "ar" | "en",
): Promise<PublicCtaBanner[]> {
  const banners = await getAdminCtaBanners();
  return toPublicCtaBanners(banners, locale);
}

export function parseCtaBannerFromForm(
  formData: FormData,
  existing?: AdminCtaBanner | null,
): AdminCtaBanner {
  const id =
    String(formData.get("id") ?? "").trim() ||
    existing?.id ||
    createCtaBannerId();
  const sortRaw = Number.parseInt(String(formData.get("sort_order") ?? ""), 10);

  return {
    id,
    title_before_ar: String(formData.get("title_before_ar") ?? "").trim(),
    title_before_en: String(formData.get("title_before_en") ?? "").trim(),
    title_highlight_ar: String(formData.get("title_highlight_ar") ?? "").trim(),
    title_highlight_en: String(formData.get("title_highlight_en") ?? "").trim(),
    description_ar: String(formData.get("description_ar") ?? "").trim(),
    description_en: String(formData.get("description_en") ?? "").trim(),
    cta_label_ar: String(formData.get("cta_label_ar") ?? "").trim(),
    cta_label_en: String(formData.get("cta_label_en") ?? "").trim(),
    href: String(formData.get("href") ?? "").trim() || "/request",
    image_ar: String(formData.get("image_ar") ?? "").trim(),
    image_en: String(formData.get("image_en") ?? "").trim(),
    sort_order: Number.isFinite(sortRaw)
      ? sortRaw
      : (existing?.sort_order ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

export function validateCtaBanner(banner: AdminCtaBanner): string | null {
  if (banner.title_before_ar.trim().length < 2) {
    return "title_ar_required";
  }
  if (!banner.href.startsWith("/")) {
    return "href_invalid";
  }
  if (!banner.image_ar && !banner.image_en) {
    return "image_required";
  }
  return null;
}
