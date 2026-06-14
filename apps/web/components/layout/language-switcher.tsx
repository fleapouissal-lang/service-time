"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/config";
import { useTheme } from "@/lib/theme/theme-context";
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
  /** Compact pill for mobile header */
  compact?: boolean;
  className?: string;
  onLocaleChange?: () => void;
};

export function LanguageSwitcher({
  isTransparent = false,
  tone = "dark",
  compact = false,
  className,
  onLocaleChange,
}: LanguageSwitcherProps) {
  const { locale, messages, setLocale, isPending } = useLocale();
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
  const isLightSurface = tone === "light";
  const isLightShell = isLightTheme || isLightSurface;

  const alternateLocale = LOCALES.find((code) => code !== locale) ?? "en";

  const compactButtonClass = cn(
    "inline-flex shrink-0 items-center justify-center rounded-full border font-semibold tracking-[0.14em] transition-all duration-300",
    "size-9 text-[10px]",
    isLightShell
      ? isTransparent
        ? "header-lang-switch__btn--light-transparent-inactive"
        : "header-lang-switch__btn--light-scrolled-inactive"
      : isTransparent
        ? "header-chrome-icon-btn"
        : "border-[var(--site-header-accent)]/25 bg-[var(--site-header-accent)]/10 text-[var(--site-header-fg)] hover:border-[var(--site-header-accent)]/45 hover:bg-[var(--site-header-accent)]/15",
    isPending && "pointer-events-none opacity-60",
    className,
  );

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => {
          setLocale(alternateLocale);
          onLocaleChange?.();
        }}
        disabled={isPending}
        aria-label={messages.language[alternateLocale]}
        title={messages.language[alternateLocale]}
        className={compactButtonClass}
      >
        {LOCALE_SHORT[alternateLocale]}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={messages.language.label}
      className={cn(
        "relative z-20 inline-flex shrink-0 items-center rounded-full border p-1 transition-all duration-300",
        compact ? "h-9" : "h-10",
        isLightShell
          ? isTransparent
            ? "header-lang-switch--light-transparent"
            : "header-lang-switch--light-scrolled"
          : isTransparent
            ? "header-chrome-lang-shell"
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
            onClick={(event) => {
              event.stopPropagation();
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
              "relative flex flex-1 items-center justify-center rounded-full font-semibold tracking-[0.14em] transition-all duration-300",
              compact ? "h-7 min-w-[2.5rem] px-2 text-[10px]" : "h-8 min-w-[2.85rem] px-3 text-[11px]",
              active
                ? isLightShell
                  ? isTransparent
                    ? "header-lang-switch__btn--light-transparent-active"
                    : "header-lang-switch__btn--light-scrolled-active"
                  : isTransparent
                    ? "header-chrome-lang-active"
                    : "bg-[#94D4B9] text-[#050B10] shadow-[0_0_18px_rgba(148,212,185,0.4)]"
                : isLightShell
                  ? isTransparent
                    ? "header-lang-switch__btn--light-transparent-inactive"
                    : "header-lang-switch__btn--light-scrolled-inactive"
                  : isTransparent
                    ? "header-chrome-lang-inactive"
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
