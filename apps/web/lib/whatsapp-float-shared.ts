/** Client-safe WhatsApp float types (no Node/fs). */

export type AdminWhatsAppFloatSettings = {
  is_active: boolean;
  phone: string;
  custom_url: string;
  message_ar: string;
  message_en: string;
};

export type PublicWhatsAppFloatSettings = {
  isActive: boolean;
  href: string;
};
