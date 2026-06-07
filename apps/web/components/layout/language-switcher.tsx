"use client";

import { Languages } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  isTransparent,
  className,
}: {
  isTransparent?: boolean;
  className?: string;
}) {
  const { locale, messages, setLocale, isPending } = useLocale();
  const nextLocale: Locale = locale === "ar" ? "en" : "ar";
  const label =
    locale === "ar"
      ? messages.language.switchToEn
      : messages.language.switchToAr;

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      disabled={isPending}
      className={cn(
        "inline-flex size-10 items-center justify-center gap-1 rounded-[20px] text-xs font-bold transition-colors",
        isTransparent
          ? "text-white hover:bg-white/10"
          : "text-[#94D4B9] hover:bg-[#94D4B9]/10",
        isPending && "opacity-60",
        className,
      )}
      aria-label={`${messages.language.label}: ${messages.language[nextLocale]}`}
      title={messages.language[nextLocale]}
    >
      <Languages className="size-4 shrink-0" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
