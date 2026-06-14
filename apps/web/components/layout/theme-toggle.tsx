"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme/theme-context";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  isTransparent?: boolean;
  /** Sidebar / light surfaces */
  tone?: "dark" | "light";
  compact?: boolean;
  className?: string;
};

export function ThemeToggle({
  isTransparent = false,
  tone = "dark",
  compact = false,
  className,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const { messages } = useLocale();
  const isLightTheme = theme === "light";
  const isLightSurface = tone === "light";
  const isLightControl = isLightTheme || isLightSurface;
  const label = isLightTheme
    ? messages.theme.switchToDark
    : messages.theme.switchToLight;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border transition-all duration-300",
        compact ? "size-9" : "size-10",
        isLightControl
          ? isTransparent
            ? "header-theme-toggle--light-transparent"
            : "header-theme-toggle--light-scrolled"
          : isTransparent
            ? "header-chrome-icon-btn"
            : "border-[var(--site-header-accent)]/25 bg-[var(--site-header-accent)]/10 text-[var(--site-header-fg)] hover:border-[var(--site-header-accent)]/45 hover:bg-[var(--site-header-accent)]/15",
        className,
      )}
    >
      {isLightTheme ? (
        <Moon className={compact ? "size-4" : "size-[1.125rem]"} aria-hidden />
      ) : (
        <Sun className={compact ? "size-4" : "size-[1.125rem]"} aria-hidden />
      )}
    </button>
  );
}
