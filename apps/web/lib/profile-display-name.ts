import type { Locale } from "@/lib/i18n/config";
import type { Profile } from "@service-time/types";
import { pickLocalized } from "@/lib/localized-content";

export type ProfileNameSource = Pick<
  Profile,
  "full_name" | "full_name_ar" | "full_name_en"
>;

export function containsArabicScript(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export function getProfileNameFields(profile: ProfileNameSource) {
  const ar = profile.full_name_ar?.trim() || profile.full_name?.trim() || "";
  const en = profile.full_name_en?.trim() || "";
  return { ar, en };
}

export function getProfileDisplayName(
  profile: ProfileNameSource,
  locale: Locale,
): string {
  const { ar, en } = getProfileNameFields(profile);
  return pickLocalized(locale, ar, en) || profile.full_name;
}

export function getProfileSearchText(profile: ProfileNameSource): string {
  const { ar, en } = getProfileNameFields(profile);
  return `${ar} ${en} ${profile.full_name}`.trim().toLowerCase();
}
