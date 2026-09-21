import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import type {
  AdminFooterContent,
  AdminFooterLink,
  FooterLinkGroup,
  PublicFooterContent,
} from "@/lib/footer-content-shared";

export type {
  AdminFooterContent,
  AdminFooterLink,
  FooterLinkGroup,
  PublicFooterContent,
} from "@/lib/footer-content-shared";

export const FOOTER_SITE_CONTENT_KEY = "site.footer";

export function createFooterLinkId(): string {
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

function normalizeLinks(raw: unknown): AdminFooterLink[] {
  if (!Array.isArray(raw)) return [];
  const result: AdminFooterLink[] = [];
  for (const [index, item] of raw.entries()) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const href = asString(row.href);
    if (!href) continue;
    const sortRaw = Number(row.sort_order);
    result.push({
      id: asString(row.id) || createFooterLinkId(),
      href,
      label_ar: asString(row.label_ar),
      label_en: asString(row.label_en),
      sort_order: Number.isFinite(sortRaw) ? sortRaw : index,
      is_active: asBool(row.is_active, true),
    });
  }
  return result.sort(
    (a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id),
  );
}

export function buildDefaultFooterContent(): AdminFooterContent {
  const ar = getDictionary("ar");
  const en = getDictionary("en");

  const quick_links: AdminFooterLink[] = [
    { id: "home", href: "/", label_ar: ar.nav.home, label_en: en.nav.home, sort_order: 0, is_active: true },
    { id: "services", href: "/services", label_ar: ar.nav.services, label_en: en.nav.services, sort_order: 1, is_active: true },
    { id: "request", href: "/request", label_ar: ar.nav.request, label_en: en.nav.request, sort_order: 2, is_active: true },
    { id: "spare-parts", href: "/spare-parts", label_ar: ar.nav.spareParts, label_en: en.nav.spareParts, sort_order: 3, is_active: true },
    { id: "locations", href: "/locations", label_ar: ar.nav.locations, label_en: en.nav.locations, sort_order: 4, is_active: true },
    { id: "about", href: "/about", label_ar: ar.nav.about, label_en: en.nav.about, sort_order: 5, is_active: true },
    { id: "contact", href: "/contact", label_ar: ar.nav.contact, label_en: en.nav.contact, sort_order: 6, is_active: true },
  ];

  const legal_links: AdminFooterLink[] = [
    {
      id: "privacy",
      href: "/legal/privacy",
      label_ar: ar.footer.privacy,
      label_en: en.footer.privacy,
      sort_order: 0,
      is_active: true,
    },
    {
      id: "terms",
      href: "/legal/terms",
      label_ar: ar.footer.terms,
      label_en: en.footer.terms,
      sort_order: 1,
      is_active: true,
    },
    {
      id: "notice",
      href: "/legal/notice",
      label_ar: ar.footer.legalNotice,
      label_en: en.footer.legalNotice,
      sort_order: 2,
      is_active: true,
    },
  ];

  return {
    brand_title_ar: "Service Time",
    brand_title_en: "Service Time",
    tagline_ar: ar.footer.tagline,
    tagline_en: en.footer.tagline,
    location_ar: ar.footer.location,
    location_en: en.footer.location,
    rights_ar: ar.footer.rights,
    rights_en: en.footer.rights,
    phone: "+966 58 381 4214",
    email: "servicetime10@gmail.com",
    section_quick_ar: ar.footer.quickLinks,
    section_quick_en: en.footer.quickLinks,
    section_legal_ar: ar.footer.legal,
    section_legal_en: en.footer.legal,
    section_contact_ar: ar.footer.contact,
    section_contact_en: en.footer.contact,
    quick_links,
    legal_links,
  };
}

function normalizeFooter(raw: unknown): AdminFooterContent | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const defaults = buildDefaultFooterContent();

  return {
    brand_title_ar: asString(row.brand_title_ar) || defaults.brand_title_ar,
    brand_title_en: asString(row.brand_title_en) || defaults.brand_title_en,
    tagline_ar: asString(row.tagline_ar) || defaults.tagline_ar,
    tagline_en: asString(row.tagline_en) || defaults.tagline_en,
    location_ar: asString(row.location_ar) || defaults.location_ar,
    location_en: asString(row.location_en) || defaults.location_en,
    rights_ar: asString(row.rights_ar) || defaults.rights_ar,
    rights_en: asString(row.rights_en) || defaults.rights_en,
    phone: asString(row.phone) || defaults.phone,
    email: asString(row.email) || defaults.email,
    section_quick_ar: asString(row.section_quick_ar) || defaults.section_quick_ar,
    section_quick_en: asString(row.section_quick_en) || defaults.section_quick_en,
    section_legal_ar: asString(row.section_legal_ar) || defaults.section_legal_ar,
    section_legal_en: asString(row.section_legal_en) || defaults.section_legal_en,
    section_contact_ar:
      asString(row.section_contact_ar) || defaults.section_contact_ar,
    section_contact_en:
      asString(row.section_contact_en) || defaults.section_contact_en,
    quick_links: (() => {
      const links = normalizeLinks(row.quick_links);
      return links.length > 0 ? links : defaults.quick_links;
    })(),
    legal_links: (() => {
      const links = normalizeLinks(row.legal_links);
      return links.length > 0 ? links : defaults.legal_links;
    })(),
  };
}

function sortLinks(links: AdminFooterLink[]): AdminFooterLink[] {
  return [...links]
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
    .map((link, index) => ({ ...link, sort_order: index }));
}

export async function getAdminFooterContent(): Promise<AdminFooterContent> {
  const admin = getAdminSupabaseClient();
  if (!admin) return buildDefaultFooterContent();

  const { data, error } = await admin
    .from("site_content")
    .select("value")
    .eq("key", FOOTER_SITE_CONTENT_KEY)
    .maybeSingle();

  if (error || !data?.value) return buildDefaultFooterContent();
  return normalizeFooter(data.value) ?? buildDefaultFooterContent();
}

export async function persistFooterContent(
  supabase: SupabaseClient,
  content: AdminFooterContent,
): Promise<void> {
  const next: AdminFooterContent = {
    ...content,
    phone: content.phone.trim(),
    email: content.email.trim(),
    quick_links: sortLinks(content.quick_links),
    legal_links: sortLinks(content.legal_links),
  };

  const { error } = await supabase.from("site_content").upsert({
    key: FOOTER_SITE_CONTENT_KEY,
    value: next,
  });
  if (error) throw new Error(error.message);

  // Keep Contact page phone/email in sync.
  await supabase.from("site_content").upsert([
    { key: "contact.phone", value: { value: next.phone } },
    { key: "contact.email", value: { value: next.email } },
  ]);
}

export function toPublicFooterContent(
  content: AdminFooterContent,
  locale: "ar" | "en",
): PublicFooterContent {
  const isEn = locale === "en";
  const mapLinks = (links: AdminFooterLink[]) =>
    links
      .filter((link) => link.is_active)
      .map((link) => ({
        id: link.id,
        href: link.href,
        label: isEn
          ? link.label_en || link.label_ar || link.href
          : link.label_ar || link.label_en || link.href,
      }));

  return {
    brandTitle: isEn
      ? content.brand_title_en || content.brand_title_ar
      : content.brand_title_ar || content.brand_title_en,
    tagline: isEn
      ? content.tagline_en || content.tagline_ar
      : content.tagline_ar || content.tagline_en,
    location: isEn
      ? content.location_en || content.location_ar
      : content.location_ar || content.location_en,
    rights: isEn
      ? content.rights_en || content.rights_ar
      : content.rights_ar || content.rights_en,
    phone: content.phone,
    email: content.email,
    sectionQuick: isEn
      ? content.section_quick_en || content.section_quick_ar
      : content.section_quick_ar || content.section_quick_en,
    sectionLegal: isEn
      ? content.section_legal_en || content.section_legal_ar
      : content.section_legal_ar || content.section_legal_en,
    sectionContact: isEn
      ? content.section_contact_en || content.section_contact_ar
      : content.section_contact_ar || content.section_contact_en,
    quickLinks: mapLinks(content.quick_links),
    legalLinks: mapLinks(content.legal_links),
  };
}

export async function getPublicFooterContent(
  locale: "ar" | "en",
): Promise<PublicFooterContent> {
  const content = await getAdminFooterContent();
  return toPublicFooterContent(content, locale);
}

export function parseFooterContentFromForm(
  formData: FormData,
  existing: AdminFooterContent,
): AdminFooterContent {
  return {
    ...existing,
    brand_title_ar: String(formData.get("brand_title_ar") ?? "").trim(),
    brand_title_en: String(formData.get("brand_title_en") ?? "").trim(),
    tagline_ar: String(formData.get("tagline_ar") ?? "").trim(),
    tagline_en: String(formData.get("tagline_en") ?? "").trim(),
    location_ar: String(formData.get("location_ar") ?? "").trim(),
    location_en: String(formData.get("location_en") ?? "").trim(),
    rights_ar: String(formData.get("rights_ar") ?? "").trim(),
    rights_en: String(formData.get("rights_en") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    section_quick_ar: String(formData.get("section_quick_ar") ?? "").trim(),
    section_quick_en: String(formData.get("section_quick_en") ?? "").trim(),
    section_legal_ar: String(formData.get("section_legal_ar") ?? "").trim(),
    section_legal_en: String(formData.get("section_legal_en") ?? "").trim(),
    section_contact_ar: String(formData.get("section_contact_ar") ?? "").trim(),
    section_contact_en: String(formData.get("section_contact_en") ?? "").trim(),
  };
}

export function parseFooterLinkFromForm(
  formData: FormData,
  existing?: AdminFooterLink | null,
): AdminFooterLink {
  const sortRaw = Number.parseInt(String(formData.get("sort_order") ?? ""), 10);
  return {
    id:
      String(formData.get("id") ?? "").trim() ||
      existing?.id ||
      createFooterLinkId(),
    href: String(formData.get("href") ?? "").trim(),
    label_ar: String(formData.get("label_ar") ?? "").trim(),
    label_en: String(formData.get("label_en") ?? "").trim(),
    sort_order: Number.isFinite(sortRaw)
      ? sortRaw
      : (existing?.sort_order ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

export function validateFooterContent(content: AdminFooterContent): string | null {
  if (content.tagline_ar.length < 2 && content.tagline_en.length < 2) {
    return "tagline_required";
  }
  if (!content.phone) return "phone_required";
  if (!content.email.includes("@")) return "email_invalid";
  return null;
}

export function validateFooterLink(link: AdminFooterLink): string | null {
  if (!link.href.startsWith("/")) return "href_invalid";
  if (link.label_ar.length < 1 && link.label_en.length < 1) {
    return "label_required";
  }
  return null;
}

export function getFooterLinkGroup(
  content: AdminFooterContent,
  group: FooterLinkGroup,
): AdminFooterLink[] {
  return group === "quick" ? content.quick_links : content.legal_links;
}

export function withFooterLinkGroup(
  content: AdminFooterContent,
  group: FooterLinkGroup,
  links: AdminFooterLink[],
): AdminFooterContent {
  if (group === "quick") return { ...content, quick_links: links };
  return { ...content, legal_links: links };
}
