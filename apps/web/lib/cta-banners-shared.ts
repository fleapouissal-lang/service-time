/** Client-safe CTA bottom-banner types (no Node/fs). */

export type AdminCtaBanner = {
  id: string;
  title_before_ar: string;
  title_before_en: string;
  title_highlight_ar: string;
  title_highlight_en: string;
  description_ar: string;
  description_en: string;
  cta_label_ar: string;
  cta_label_en: string;
  href: string;
  image_ar: string;
  image_en: string;
  sort_order: number;
  is_active: boolean;
};

export type PublicCtaBanner = {
  id: string;
  titleBefore: string;
  titleHighlight: string;
  description: string;
  ctaLabel: string;
  href: string;
  imageSrc: string;
};
