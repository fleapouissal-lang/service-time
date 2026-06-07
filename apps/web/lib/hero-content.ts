import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/messages/types";

function cmsField(
  cms: Record<string, unknown> | null,
  locale: Locale,
  arKey: string,
  enKey: string,
): string | null {
  const key = locale === "ar" ? arKey : enKey;
  const value = cms?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function resolveHeroContent(
  cms: Record<string, unknown> | null,
  locale: Locale,
  t: Messages,
) {
  const migrated = Boolean(cms?.title_before_ar || cms?.title_before_en);
  const fallbacks = t.home.hero;

  if (!migrated) {
    return {
      titleBefore: fallbacks.titleBefore,
      titleHighlight: fallbacks.titleHighlight,
      subtitle: fallbacks.subtitle,
      cta: fallbacks.cta,
    };
  }

  return {
    titleBefore:
      cmsField(cms, locale, "title_before_ar", "title_before_en") ??
      fallbacks.titleBefore,
    titleHighlight:
      cmsField(cms, locale, "title_highlight_ar", "title_highlight_en") ??
      fallbacks.titleHighlight,
    subtitle:
      cmsField(cms, locale, "subtitle_ar", "subtitle_en") ?? fallbacks.subtitle,
    cta: cmsField(cms, locale, "cta_ar", "cta_en") ?? fallbacks.cta,
  };
}
