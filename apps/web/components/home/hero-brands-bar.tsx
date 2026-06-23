"use client";

import { HERO_BRAND_LOGOS } from "@/lib/hero-brand-logos";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

const MARQUEE_COPIES = 4;

function BrandStrip({ copyIndex }: { copyIndex: number }) {
  return (
    <div className="hero-brands-bar__strip flex shrink-0 items-center">
      {HERO_BRAND_LOGOS.map((brand) => (
        <div
          key={`${copyIndex}-${brand.name}`}
          className={cn(
            "hero-brands-bar__item flex shrink-0 items-center justify-center",
            brand.wide
              ? "hero-brands-bar__item--wide"
              : "hero-brands-bar__item--compact",
          )}
          aria-hidden
        >
          {/* SVG mono depuis public/brands/hero/ */}
          <img
            src={brand.src}
            alt=""
            className="hero-brands-bar__logo"
            draggable={false}
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
    </div>
  );
}

export function HeroBrandsBar() {
  const { messages: t } = useLocale();

  return (
    <div
      className="hero-brands-bar absolute inset-x-0 bottom-0 z-20 border-t py-3 backdrop-blur-sm sm:py-3.5"
      aria-label={t.home.heroBrands.ariaLabel}
    >
      <div className="hero-brands-bar__viewport" dir="ltr">
        <div className="hero-brands-bar__track flex">
          {Array.from({ length: MARQUEE_COPIES }, (_, i) => (
            <BrandStrip key={i} copyIndex={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
