export const CTA_SLIDE_IDS = [
  "roadside",
  "maintenance",
  "spareparts",
  "towing",
  "mobile",
] as const;

export type CtaSlideId = (typeof CTA_SLIDE_IDS)[number];

const CTA_IMAGE_VERSION = "5";

function ctaImage(path: string): string {
  return `${path}?v=${CTA_IMAGE_VERSION}`;
}

export const CTA_SLIDE_IMAGES: Record<
  CtaSlideId,
  { src: string; objectPosition: string }
> = {
  roadside: {
    src: ctaImage("/cta/slide-roadside.png"),
    objectPosition: "center center",
  },
  maintenance: {
    src: ctaImage("/cta/slide-maintenance.png"),
    objectPosition: "center center",
  },
  spareparts: {
    src: ctaImage("/cta/slide-spareparts.png"),
    objectPosition: "center center",
  },
  towing: {
    src: ctaImage("/cta/slide-towing.png"),
    objectPosition: "center center",
  },
  mobile: {
    src: ctaImage("/cta/slide-mobile.png"),
    objectPosition: "center center",
  },
};

export function getCtaSlideImage(slideId: CtaSlideId): string {
  return CTA_SLIDE_IMAGES[slideId].src;
}
