export type HeroMobileBanner = {
  src: string;
  href: string;
  alt: string;
};

/** Bump when replacing files in public/hero/mobile/ to bust caches. */
export const HERO_MOBILE_IMAGE_VERSION = "1";

export const AR_MOBILE_BANNERS: HeroMobileBanner[] = [
  {
    src: "/hero/mobile/hero-maintenance-mobile-ar.png",
    href: "/request?category=periodic_maintenance",
    alt: "صيانة اليوم… راحة لبكرة",
  },
  {
    src: "/hero/mobile/hero-towing-mobile-ar.png",
    href: "/request?category=emergency",
    alt: "سطحتك بطلب واحد",
  },
  {
    src: "/hero/mobile/hero-roadside-mobile-ar.png",
    href: "/request?category=emergency",
    alt: "معك في كل مشوار",
  },
  {
    src: "/hero/mobile/hero-spareparts-mobile-ar.png",
    href: "/spare-parts",
    alt: "دورناها عنك",
  },
  {
    src: "/hero/mobile/hero-bodywork-mobile-ar.png",
    href: "/request",
    alt: "لا تشيل هم الصدمة",
  },
];

export const EN_MOBILE_BANNERS: HeroMobileBanner[] = [
  {
    src: "/hero/mobile/hero-maintenance-mobile-en.png",
    href: "/request?category=periodic_maintenance",
    alt: "Car service, peace of mind",
  },
  {
    src: "/hero/mobile/hero-towing-mobile-en.png",
    href: "/request?category=emergency",
    alt: "Your car, our priority",
  },
  {
    src: "/hero/mobile/hero-roadside-mobile-en.png",
    href: "/request?category=emergency",
    alt: "Your car deserves the best",
  },
  {
    src: "/hero/mobile/hero-spareparts-mobile-en.png",
    href: "/spare-parts",
    alt: "Your car, our priority — spare parts",
  },
  {
    src: "/hero/mobile/hero-bodywork-mobile-en.png",
    href: "/request",
    alt: "Don't ignore the damage",
  },
];
