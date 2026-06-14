"use client";

import Image from "next/image";
import { useTheme } from "@/lib/theme/theme-context";

export function HeroDesktopBackground() {
  const { theme } = useTheme();

  return (
    <Image
      src={theme === "light" ? "/hero-bg-light.png" : "/hero-bg.png"}
      alt=""
      fill
      priority
      quality={80}
      sizes="100vw"
      className="object-cover object-center"
    />
  );
}
