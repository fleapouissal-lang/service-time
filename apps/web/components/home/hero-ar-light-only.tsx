"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { useTheme } from "@/lib/theme/theme-context";

type HeroArLightOnlyProps = {
  children: ReactNode;
  locale: Locale;
};

export function HeroArLightOnly({ children, locale }: HeroArLightOnlyProps) {
  const { theme } = useTheme();

  if (locale === "ar" && theme === "dark") {
    return null;
  }

  return children;
}
