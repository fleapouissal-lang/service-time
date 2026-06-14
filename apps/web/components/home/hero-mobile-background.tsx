"use client";

import Image from "next/image";
import { useTheme } from "@/lib/theme/theme-context";
import { cn } from "@/lib/utils";

type HeroMobileBackgroundProps = {
  isRtl: boolean;
};

export function HeroMobileBackground({ isRtl }: HeroMobileBackgroundProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <Image
      src={isLight ? "/hero-bg-mobile-light.png" : "/hero-bg-mobile-car.png"}
      alt=""
      fill
      priority
      fetchPriority="high"
      quality={75}
      sizes="100vw"
      className={cn(
        "hero-mobile-bg-drift object-cover",
        isLight ? "object-center" : isRtl ? "object-left" : "object-right",
      )}
    />
  );
}
