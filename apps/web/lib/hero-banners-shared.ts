/** Client-safe hero banner types (no Node/fs). */

export type AdminHeroBanner = {
  id: string;
  href: string;
  alt_ar: string;
  alt_en: string;
  image_desktop_ar: string;
  image_desktop_en: string;
  image_mobile_ar: string;
  image_mobile_en: string;
  sort_order: number;
  is_active: boolean;
};

export type PublicHeroBanner = {
  id: string;
  src: string;
  href: string;
  alt: string;
};
