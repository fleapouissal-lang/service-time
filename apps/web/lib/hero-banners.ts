import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import type {
  AdminHeroBanner,
  PublicHeroBanner,
} from "@/lib/hero-banners-shared";

export type {
  AdminHeroBanner,
  PublicHeroBanner,
} from "@/lib/hero-banners-shared";

export const HERO_BANNERS_SITE_CONTENT_KEY = "home.hero_banners";

export function createHeroBannerId(): string {
  return crypto.randomUUID();
}

/** Default banners matching the previous hardcoded slides. */
export function buildDefaultHeroBanners(): AdminHeroBanner[] {
  return [
    {
      id: "maintenance",
      href: "/request?category=periodic_maintenance",
      alt_ar: "صيانة اليوم… راحة لبكرة",
      alt_en: "Service today, comfort tomorrow",
      image_desktop_ar: "/hero/hero-maintenance-dark.png",
      image_desktop_en: "/hero/hero-maintenance-dark-en.png",
      image_mobile_ar: "/hero/mobile/hero-maintenance-mobile-ar.png",
      image_mobile_en: "/hero/mobile/hero-maintenance-mobile-en.png",
      sort_order: 0,
      is_active: true,
    },
    {
      id: "towing",
      href: "/request?category=emergency",
      alt_ar: "سطحتك بطلب واحد",
      alt_en: "One call away",
      image_desktop_ar: "/hero/hero-towing-light.png",
      image_desktop_en: "/hero/hero-towing-light-en.png",
      image_mobile_ar: "/hero/mobile/hero-towing-mobile-ar.png",
      image_mobile_en: "/hero/mobile/hero-towing-mobile-en.png",
      sort_order: 1,
      is_active: true,
    },
    {
      id: "roadside",
      href: "/request?category=emergency",
      alt_ar: "معك في كل مشوار",
      alt_en: "With you on every trip",
      image_desktop_ar: "/hero/hero-roadside-dark.png",
      image_desktop_en: "/hero/hero-roadside-dark-en.png",
      image_mobile_ar: "/hero/mobile/hero-roadside-mobile-ar.png",
      image_mobile_en: "/hero/mobile/hero-roadside-mobile-en.png",
      sort_order: 2,
      is_active: true,
    },
    {
      id: "spareparts",
      href: "/spare-parts",
      alt_ar: "دورناها عنك",
      alt_en: "We've got it covered",
      image_desktop_ar: "/hero/hero-spareparts-dark.png",
      image_desktop_en: "/hero/hero-spareparts-dark-en.png",
      image_mobile_ar: "/hero/mobile/hero-spareparts-mobile-ar.png",
      image_mobile_en: "/hero/mobile/hero-spareparts-mobile-en.png",
      sort_order: 3,
      is_active: true,
    },
    {
      id: "bodywork",
      href: "/request",
      alt_ar: "لا تشيل هم الصدمة",
      alt_en: "Don't stress the crash",
      image_desktop_ar: "/hero/hero-bodywork-light.png",
      image_desktop_en: "/hero/hero-bodywork-light-en.png",
      image_mobile_ar: "/hero/mobile/hero-bodywork-mobile-ar.png",
      image_mobile_en: "/hero/mobile/hero-bodywork-mobile-en.png",
      sort_order: 4,
      is_active: true,
    },
  ];
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

function normalizeBanners(raw: unknown): AdminHeroBanner[] | null {
  if (!raw || typeof raw !== "object") return null;
  const list = (raw as { banners?: unknown }).banners;
  if (!Array.isArray(list)) return null;

  const result: AdminHeroBanner[] = [];
  for (const [index, item] of list.entries()) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = asString(row.id) || createHeroBannerId();
    const href = asString(row.href);
    if (!href) continue;

    const sortRaw = Number(row.sort_order);
    result.push({
      id,
      href,
      alt_ar: asString(row.alt_ar),
      alt_en: asString(row.alt_en),
      image_desktop_ar: asString(row.image_desktop_ar),
      image_desktop_en: asString(row.image_desktop_en),
      image_mobile_ar: asString(row.image_mobile_ar),
      image_mobile_en: asString(row.image_mobile_en),
      sort_order: Number.isFinite(sortRaw) ? sortRaw : index,
      is_active: asBool(row.is_active, true),
    });
  }

  return result.sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
}

export async function getAdminHeroBanners(): Promise<AdminHeroBanner[]> {
  const admin = getAdminSupabaseClient();
  if (!admin) return buildDefaultHeroBanners();

  const { data, error } = await admin
    .from("site_content")
    .select("value")
    .eq("key", HERO_BANNERS_SITE_CONTENT_KEY)
    .maybeSingle();

  if (error || !data?.value) return buildDefaultHeroBanners();

  const parsed = normalizeBanners(data.value);
  if (!parsed || parsed.length === 0) return buildDefaultHeroBanners();
  return parsed;
}

export async function persistHeroBanners(
  supabase: SupabaseClient,
  banners: AdminHeroBanner[],
): Promise<void> {
  const normalized = banners
    .map((banner, index) => ({
      ...banner,
      href: banner.href.trim(),
      sort_order: Number.isFinite(banner.sort_order) ? banner.sort_order : index,
    }))
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
    .map((banner, index) => ({ ...banner, sort_order: index }));

  const { error } = await supabase.from("site_content").upsert({
    key: HERO_BANNERS_SITE_CONTENT_KEY,
    value: { banners: normalized },
  });

  if (error) throw new Error(error.message);
}

export function toPublicHeroBanners(
  banners: AdminHeroBanner[],
  locale: "ar" | "en",
  surface: "desktop" | "mobile",
): PublicHeroBanner[] {
  return banners
    .filter((banner) => banner.is_active)
    .map((banner) => {
      const isEn = locale === "en";
      const src =
        surface === "desktop"
          ? isEn
            ? banner.image_desktop_en || banner.image_desktop_ar
            : banner.image_desktop_ar || banner.image_desktop_en
          : isEn
            ? banner.image_mobile_en || banner.image_mobile_ar
            : banner.image_mobile_ar || banner.image_mobile_en;

      return {
        id: banner.id,
        src,
        href: banner.href,
        alt: isEn
          ? banner.alt_en || banner.alt_ar || banner.href
          : banner.alt_ar || banner.alt_en || banner.href,
      };
    })
    .filter((banner) => Boolean(banner.src));
}

export async function getPublicHeroBanners(
  locale: "ar" | "en",
  surface: "desktop" | "mobile",
): Promise<PublicHeroBanner[]> {
  const banners = await getAdminHeroBanners();
  return toPublicHeroBanners(banners, locale, surface);
}

export function parseHeroBannerFromForm(
  formData: FormData,
  existing?: AdminHeroBanner | null,
): AdminHeroBanner {
  const id =
    String(formData.get("id") ?? "").trim() ||
    existing?.id ||
    createHeroBannerId();
  const sortRaw = Number.parseInt(String(formData.get("sort_order") ?? ""), 10);

  return {
    id,
    href: String(formData.get("href") ?? "").trim(),
    alt_ar: String(formData.get("alt_ar") ?? "").trim(),
    alt_en: String(formData.get("alt_en") ?? "").trim(),
    image_desktop_ar:
      String(formData.get("image_desktop_ar") ?? "").trim() ||
      existing?.image_desktop_ar ||
      "",
    image_desktop_en:
      String(formData.get("image_desktop_en") ?? "").trim() ||
      existing?.image_desktop_en ||
      "",
    image_mobile_ar:
      String(formData.get("image_mobile_ar") ?? "").trim() ||
      existing?.image_mobile_ar ||
      "",
    image_mobile_en:
      String(formData.get("image_mobile_en") ?? "").trim() ||
      existing?.image_mobile_en ||
      "",
    sort_order: Number.isFinite(sortRaw)
      ? sortRaw
      : (existing?.sort_order ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

export function validateHeroBanner(banner: AdminHeroBanner): string | null {
  if (!banner.href.startsWith("/")) return "href_invalid";
  if (!banner.image_desktop_ar && !banner.image_desktop_en) {
    return "desktop_image_required";
  }
  if (!banner.image_mobile_ar && !banner.image_mobile_en) {
    return "mobile_image_required";
  }
  return null;
}
