/** Client-safe footer CMS types (no Node/fs). */

export type AdminFooterLink = {
  id: string;
  href: string;
  label_ar: string;
  label_en: string;
  sort_order: number;
  is_active: boolean;
};

export type AdminFooterContent = {
  brand_title_ar: string;
  brand_title_en: string;
  tagline_ar: string;
  tagline_en: string;
  location_ar: string;
  location_en: string;
  rights_ar: string;
  rights_en: string;
  phone: string;
  email: string;
  section_quick_ar: string;
  section_quick_en: string;
  section_legal_ar: string;
  section_legal_en: string;
  section_contact_ar: string;
  section_contact_en: string;
  quick_links: AdminFooterLink[];
  legal_links: AdminFooterLink[];
};

export type FooterLinkGroup = "quick" | "legal";

export type PublicFooterContent = {
  brandTitle: string;
  tagline: string;
  location: string;
  rights: string;
  phone: string;
  email: string;
  sectionQuick: string;
  sectionLegal: string;
  sectionContact: string;
  quickLinks: { id: string; href: string; label: string }[];
  legalLinks: { id: string; href: string; label: string }[];
};
