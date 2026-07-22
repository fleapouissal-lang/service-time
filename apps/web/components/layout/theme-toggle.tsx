"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme/theme-context";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  isTransparent?: boolean;
  /** Sidebar / light surfaces — kept for call-site compatibility */
  tone?: "dark" | "light";
  compact?: boolean;
  className?: string;
};

export function ThemeToggle({
  isTransparent = false,
  compact = false,
  className,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const { messages } = useLocale();
  const isLightTheme = theme === "light";
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
        isLightTheme
          ? isTransparent
            ? "border-black/15 bg-white text-[#050B10] shadow-[0_2px_10px_rgba(0,0,0,0.12)] hover:bg-white/90"
            : "border-black/10 bg-white text-[#050B10] shadow-[0_2px_10px_rgba(0,0,0,0.1)] hover:bg-[#f3faf6]"
          : isTransparent
            ? "border-[#94D4B9]/35 bg-[#050B10]/80 text-[#94D4B9] backdrop-blur-sm hover:border-[#94D4B9]/55 hover:bg-[#050B10]"
            : "border-white/15 bg-[#050B10] text-white hover:border-white/30 hover:bg-black",
        className,
      )}
    >
      {isLightTheme ? (
        <Sun className={compact ? "size-4" : "size-[1.125rem]"} aria-hidden />
      ) : (
        <Moon className={compact ? "size-4" : "size-[1.125rem]"} aria-hidden />
      )}
    </button>
  );
}
