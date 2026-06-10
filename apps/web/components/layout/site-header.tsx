"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HeaderAuthSection } from "@/components/layout/header-auth-section";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileAccountButton } from "@/components/layout/mobile-account-button";
import { HeaderCartButton } from "@/components/spare-parts/header-cart-button";
import { useLocale } from "@/lib/i18n/locale-context";
import { getNavLinks } from "@/lib/i18n/nav";
import { cn } from "@/lib/utils";

const HEADER_BG = "bg-[#050B10]";
const HEADER_FG = "text-[#94D4B9]";
const SCROLL_THRESHOLD = 24;

function navLinkClass(active: boolean, transparent: boolean) {
  if (transparent) {
    return cn(
      "px-3 py-2 text-sm font-medium transition-all duration-200",
      active
        ? "-translate-y-0.5 border-b-2 border-[#94D4B9] pb-1.5 font-semibold text-[#94D4B9]"
        : "border-b-2 border-transparent pb-1.5 text-white hover:text-[#94D4B9]",
    );
  }

  return cn(
    "px-3 py-2 text-sm font-medium transition-all duration-200",
    HEADER_FG,
    active
      ? "-translate-y-0.5 border-b-2 border-[#94D4B9] pb-1.5 font-semibold"
      : "border-b-2 border-transparent pb-1.5 hover:text-white",
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { messages } = useLocale();
  const navLinks = getNavLinks(messages);
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === "/";
  const isTransparent = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        isTransparent
          ? "bg-transparent md:rounded-b-[20px]"
          : cn("rounded-b-[20px]", HEADER_BG),
        scrolled && "site-header-scrolled",
        isHome
          ? "max-md:bg-transparent max-md:backdrop-blur-none"
          : "max-md:bg-[#050B10]/95 max-md:backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center bg-transparent">
          <Image
            src="/logos/logo-ar.png"
            alt="Service Time — سيرفيس تايم"
            width={280}
            height={98}
            className="h-10 w-auto bg-transparent object-contain brightness-[1.15] contrast-[1.08] sm:h-16 md:h-[4.75rem]"
            priority
            unoptimized
          />
        </Link>

        <nav className="hidden min-w-0 items-center gap-0.5 xl:flex xl:gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                navLinkClass(pathname === link.href, isTransparent),
                "px-2 text-xs xl:px-3 xl:text-sm",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-1.5 lg:flex xl:gap-2">
          <LanguageSwitcher isTransparent={isTransparent} />
          <HeaderCartButton isTransparent={isTransparent} />
          <HeaderAuthSection isTransparent={isTransparent} variant="desktop" />
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-1.5 lg:hidden">
          <LanguageSwitcher isTransparent={isTransparent} compact />
          <HeaderCartButton isTransparent={isTransparent} />
          <MobileAccountButton isTransparent={isTransparent} />
        </div>
      </div>
    </header>
  );
}
