export const CTA_SLIDE_IDS = ["roadside", "maintenance"] as const;

export type CtaSlideId = (typeof CTA_SLIDE_IDS)[number];

const CTA_IMAGE_VERSION = "2";

function ctaImage(path: string): string {
  return `${path}?v=${CTA_IMAGE_VERSION}`;
}

export const CTA_SLIDE_IMAGES: Record<
  CtaSlideId,
  { dark: string; light: string; objectPosition: string; objectPositionRtl: string }
> = {
  roadside: {
    dark: ctaImage("/cta/slide-roadside-dark.png"),
    light: ctaImage("/cta/slide-roadside-light.png"),
    objectPosition: "center right",
    objectPositionRtl: "center left",
  },
  maintenance: {
    dark: ctaImage("/cta/slide-maintenance-dark.png"),
    light: ctaImage("/cta/slide-maintenance-light.png"),
    objectPosition: "center right",
    objectPositionRtl: "center left",
  },
};

export function getCtaSlideImage(
  slideId: CtaSlideId,
  theme: "dark" | "light",
): string {
  return CTA_SLIDE_IMAGES[slideId][theme];
}
