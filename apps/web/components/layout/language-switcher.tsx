"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const LOCALES: Locale[] = ["en", "ar"];

const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  ar: "AR",
};

type LanguageSwitcherProps = {
  isTransparent?: boolean;
  /** Sidebar / light surfaces */
  tone?: "dark" | "light";
  className?: string;
  onLocaleChange?: () => void;
};

export function LanguageSwitcher({
  isTransparent = false,
  tone = "dark",
  className,
  onLocaleChange,
}: LanguageSwitcherProps) {
  const { locale, messages, setLocale, isPending } = useLocale();
  const isLight = tone === "light";

  return (
    <div
      role="group"
      aria-label={messages.language.label}
      className={cn(
        "inline-flex h-10 items-center rounded-full border p-1 transition-all duration-300",
        isLight
          ? "border-[#94D4B9]/35 bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
          : isTransparent
            ? "border-white/20 bg-white/5 backdrop-blur-md"
            : "border-[#94D4B9]/20 bg-[#94D4B9]/[0.06] shadow-[inset_0_1px_0_rgba(148,212,185,0.08)]",
        isPending && "pointer-events-none opacity-60",
        className?.includes("w-full") && "mx-auto w-full max-w-[9.25rem]",
        className,
      )}
    >
      {LOCALES.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => {
              if (!active) {
                setLocale(code);
                onLocaleChange?.();
              }
            }}
            disabled={isPending}
            aria-pressed={active}
            aria-label={messages.language[code]}
            title={messages.language[code]}
            className={cn(
              "relative flex h-8 min-w-[2.85rem] flex-1 items-center justify-center rounded-full px-3 text-[11px] font-semibold tracking-[0.14em] transition-all duration-300",
              active
                ? "bg-[#94D4B9] text-[#050B10] shadow-[0_0_18px_rgba(148,212,185,0.4)]"
                : isLight
                  ? "text-[#050B10]/55 hover:text-[#050B10]"
                  : isTransparent
                    ? "text-white/65 hover:text-white"
                    : "text-[#94D4B9]/65 hover:text-[#94D4B9]",
            )}
          >
            {LOCALE_SHORT[code]}
          </button>
        );
      })}
    </div>
  );
}
