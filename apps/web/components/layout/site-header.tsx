"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HeaderAuthSection } from "@/components/layout/header-auth-section";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileAccountButton } from "@/components/layout/mobile-account-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { HeaderCartButton } from "@/components/spare-parts/header-cart-button";
import { useLocale } from "@/lib/i18n/locale-context";
import { getNavLinks } from "@/lib/i18n/nav";
import { useTheme } from "@/lib/theme/theme-context";
import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD = 24;

function navLinkClass(active: boolean, transparent: boolean) {
  if (transparent) {
    return cn(
      "px-3 py-2 text-sm font-medium transition-all duration-200",
      active
        ? cn(
            "-translate-y-0.5 border-b-2 pb-1.5 font-semibold header-chrome-nav-link--active",
          )
        : cn(
            "border-b-2 border-transparent pb-1.5 header-chrome-nav-link",
          ),
    );
  }

  return cn(
    "px-3 py-2 text-sm font-medium transition-all duration-200 text-[var(--site-header-fg)]",
    active
      ? "-translate-y-0.5 border-b-2 border-[var(--site-header-link-active-border)] pb-1.5 font-semibold text-[var(--site-header-fg)]"
      : "border-b-2 border-transparent pb-1.5 hover:text-[var(--site-header-fg-hover)]",
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { messages, locale } = useLocale();
  const { theme } = useTheme();
  const navLinks = getNavLinks(messages);
  const [scrolled, setScrolled] = useState(false);
  const isEnglish = locale === "en";
  const logoSrc = isEnglish ? "/logos/logo-en.png" : "/logos/logo-ar.png";
  const logoAlt = isEnglish ? "Service Time" : "Service Time — سيرفيس تايم";

  const isHome = pathname === "/";
  // On mobile home there is no page scroll; keep overlay even if scroll state flickers.
  const isTransparent = isHome && !scrolled;

  useEffect(() => {
    setScrolled(false);

    const onScroll = () => {
      // Mobile home locks scroll — never switch to solid bar there.
      if (window.matchMedia("(max-width: 767px)").matches && pathname === "/") {
        setScrolled(false);
        return;
      }
      setScrolled(
        (window.scrollY || document.documentElement.scrollTop) > SCROLL_THRESHOLD,
      );
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return (
    <header
      data-home-overlay={isTransparent ? "true" : undefined}
      className={cn(
        "site-header z-50 transition-all duration-300",
        isTransparent
          ? cn(
              "site-header--overlay site-header-transparent bg-transparent shadow-none backdrop-blur-none",
              "fixed inset-x-0 top-0 md:sticky md:top-0",
            )
          : cn(
              "sticky top-0 site-header--solid rounded-b-[20px] bg-site-header max-md:rounded-b-[20px]",
              theme === "dark"
                ? "site-header--solid-dark"
                : "site-header--solid-light",
            ),
        scrolled && "site-header-scrolled",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center bg-transparent">
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={280}
            height={98}
            sizes="(max-width: 640px) 160px, 280px"
            unoptimized
            className={cn(
              "h-10 w-auto bg-transparent object-contain sm:h-16 md:h-[4.75rem]",
              !isEnglish && "brightness-[1.15] contrast-[1.08]",
            )}
            priority
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
          <ThemeToggle isTransparent={isTransparent} />
          <LanguageSwitcher isTransparent={isTransparent} />
          <HeaderCartButton isTransparent={isTransparent} />
          <HeaderAuthSection isTransparent={isTransparent} variant="desktop" />
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-1.5 lg:hidden">
          <ThemeToggle isTransparent={isTransparent} compact />
          <LanguageSwitcher isTransparent={isTransparent} compact />
          <HeaderCartButton isTransparent={isTransparent} />
          <MobileAccountButton isTransparent={isTransparent} />
        </div>
      </div>
    </header>
  );
}
