"use client";

import { useLocale } from "@/lib/i18n/locale-context";

const BRAND_LOGOS = [
  { name: "Toyota", src: "/brands/toyota.svg" },
  { name: "Hyundai", src: "/brands/hyundai.svg" },
  { name: "Nissan", src: "/brands/nissan.svg" },
  { name: "Kia", src: "/brands/kia.svg" },
  { name: "Honda", src: "/brands/honda.svg" },
  { name: "Mercedes-Benz", src: "/brands/mercedes.svg" },
  { name: "BMW", src: "/brands/bmw.svg" },
  { name: "Ford", src: "/brands/ford.svg" },
  { name: "Chevrolet", src: "/brands/chevrolet.svg" },
  { name: "Lexus", src: "/brands/lexus.svg" },
  { name: "GMC", src: "/brands/gmc.svg" },
  { name: "Haval", src: "/brands/haval.svg" },
  { name: "Mazda", src: "/brands/mazda.svg" },
  { name: "Mitsubishi", src: "/brands/mitsubishi.svg" },
  { name: "Jeep", src: "/brands/jeep.svg" },
  { name: "Suzuki", src: "/brands/suzuki.svg" },
  { name: "Tesla", src: "/brands/tesla.svg" },
  { name: "Volkswagen", src: "/brands/volkswagen.svg" },
  { name: "Genesis", src: "/brands/genesis.svg" },
  { name: "Infiniti", src: "/brands/infiniti.svg" },
  { name: "Audi", src: "/brands/audi.svg" },
  { name: "Land Rover", src: "/brands/landrover.svg" },
  { name: "Porsche", src: "/brands/porsche.svg" },
] as const;

const MARQUEE_COPIES = 4;

function BrandStrip({ copyIndex }: { copyIndex: number }) {
  return (
    <div className="hero-brands-bar__strip flex shrink-0 items-center">
      {BRAND_LOGOS.map((brand) => (
        <div
          key={`${copyIndex}-${brand.name}`}
          className="hero-brands-bar__item flex shrink-0 items-center justify-center px-6 sm:px-8"
          aria-hidden
        >
          <img
            src={brand.src}
            alt=""
            width={140}
            height={40}
            className="hero-brands-bar__logo h-8 w-auto sm:h-9"
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
      className="hero-brands-bar absolute inset-x-0 bottom-0 z-20 border-t py-4 backdrop-blur-sm sm:py-4.5"
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
