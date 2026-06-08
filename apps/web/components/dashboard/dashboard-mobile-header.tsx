"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type DashboardMobileHeaderProps = {
  open: boolean;
  onToggle: () => void;
};

export function DashboardMobileHeader({
  open,
  onToggle,
}: DashboardMobileHeaderProps) {
  const { messages } = useLocale();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 shrink-0 border-b transition-colors duration-300 lg:hidden",
        open
          ? "border-b-0 bg-[#94D4B9]"
          : "border-[#94D4B9]/15 bg-[#050B10]",
      )}
    >
      <div className="flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex shrink-0 items-center bg-transparent">
          {open ? (
            <Image
              src="/logos/banner.png"
              alt="Service Time — سيرفيس تايم"
              width={280}
              height={72}
              className="h-12 w-auto max-w-[11rem] object-contain object-center brightness-[1.08] contrast-[1.05]"
              priority
              unoptimized
            />
          ) : (
            <Image
              src="/logos/logo-ar.png"
              alt="Service Time — سيرفيس تايم"
              width={280}
              height={98}
              className="h-14 w-auto object-contain brightness-[1.15] contrast-[1.08]"
              priority
              unoptimized
            />
          )}
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher tone={open ? "light" : "dark"} />
          <button
            type="button"
            className={cn(
              "p-2 transition-colors",
              open
                ? "text-[#050B10] hover:text-[#050B10]/75"
                : "text-[#94D4B9] hover:text-white",
            )}
            onClick={onToggle}
            aria-expanded={open}
            aria-label={messages.common.menu}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>
    </header>
  );
}
