/** Bump when replacing files in public/brands/hero/. */
const HERO_BRAND_VERSION = "2";

function heroBrandSrc(file: string): string {
  return `/brands/hero/${file}?v=${HERO_BRAND_VERSION}`;
}

/** Marques chinoises — logos normalisés pour la barre hero (`public/brands/hero/`). */
export const HERO_BRAND_LOGOS = [
  { name: "BYD", src: heroBrandSrc("byd.svg"), wide: true },
  { name: "Changan", src: heroBrandSrc("changan.svg"), wide: true },
  { name: "Geely", src: heroBrandSrc("geely.svg"), wide: true },
  { name: "Chery", src: heroBrandSrc("chery.svg"), wide: false },
  { name: "MG", src: heroBrandSrc("mg.svg"), wide: false },
  { name: "Haval", src: heroBrandSrc("haval.svg"), wide: false },
  { name: "GAC", src: heroBrandSrc("gac.svg"), wide: true },
  { name: "Hongqi", src: heroBrandSrc("hongqi.svg"), wide: true },
  { name: "Jetour", src: heroBrandSrc("jetour.svg"), wide: true },
  { name: "Tank", src: heroBrandSrc("tank.svg"), wide: false },
  { name: "NIO", src: heroBrandSrc("nio.svg"), wide: false },
  { name: "XPeng", src: heroBrandSrc("xpeng.svg"), wide: false },
] as const;

export type HeroBrandLogo = (typeof HERO_BRAND_LOGOS)[number];
