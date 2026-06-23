export const HERO_AR_DARK_SLIDES = [
  {
    src: "/hero/ar-dark/slide-1.png",
    alt: "Service Time — تتبع الطلب",
    width: 1024,
    height: 509,
  },
  {
    src: "/hero/ar-dark/slide-2.png",
    alt: "Service Time — مساعدة على الطريق",
    width: 1024,
    height: 576,
  },
  {
    src: "/hero/ar-dark/slide-3.png",
    alt: "Service Time — قطع الغيار",
    width: 1024,
    height: 682,
  },
  {
    src: "/hero/ar-dark/slide-4.png",
    alt: "Service Time — دعم طوارئ",
    width: 1024,
    height: 682,
  },
  {
    src: "/hero/ar-dark/slide-5.png",
    alt: "Service Time — صيانة دورية",
    width: 1024,
    height: 576,
  },
] as const;

export type HeroArDarkSlide = (typeof HERO_AR_DARK_SLIDES)[number];

export function heroSlideHeightCss(slide: HeroArDarkSlide): string {
  return `calc(100vw * ${slide.height} / ${slide.width})`;
}
