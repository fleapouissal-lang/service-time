"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HeaderAuthSection } from "@/components/layout/header-auth-section";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
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
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === "/";
  const isTransparent = isHome && !scrolled && !open;
  const closeMenu = () => setOpen(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
      setOpen((isOpen) => (isOpen ? false : isOpen));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const handleMenuScroll = () => closeMenu();
    const menuEl = menuRef.current;
    menuEl?.addEventListener("scroll", handleMenuScroll, { passive: true });
    window.addEventListener("wheel", handleMenuScroll, { passive: true });

    return () => {
      document.body.style.overflow = "";
      menuEl?.removeEventListener("scroll", handleMenuScroll);
      window.removeEventListener("wheel", handleMenuScroll);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        open || !isTransparent
          ? cn("rounded-b-[20px]", HEADER_BG)
          : "bg-transparent",
        scrolled && "site-header-scrolled",
      )}
    >
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center bg-transparent">
          <Image
            src="/logos/logo-ar.png"
            alt="Service Time — سيرفيس تايم"
            width={280}
            height={98}
            className="h-16 w-auto bg-transparent object-contain brightness-[1.15] contrast-[1.08] sm:h-[4.75rem]"
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

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 xl:hidden">
          <LanguageSwitcher isTransparent={isTransparent} />
          <HeaderCartButton isTransparent={isTransparent} />
          <button
            type="button"
            className={cn(
              "p-2 transition-colors duration-300",
              isTransparent ? "text-white" : HEADER_FG,
            )}
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={messages.common.menu}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          ref={menuRef}
          className={cn(
            "fixed inset-x-0 top-20 z-40 flex h-[calc(100dvh-5rem)] flex-col border-t px-4 xl:hidden",
            "border-[#94D4B9]/15 bg-[#050B10]",
          )}
        >
          <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-6">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className={cn(
                    "px-3 py-3 text-base transition-all duration-200",
                    HEADER_FG,
                    active
                      ? "-translate-y-0.5 font-semibold underline decoration-2 underline-offset-4"
                      : "font-medium hover:text-white",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0 border-t border-[#94D4B9]/15 px-1 py-4 pb-6">
            <HeaderAuthSection
              isTransparent={false}
              variant="mobile"
              onNavigate={closeMenu}
            />
          </div>
        </div>
      ) : null}
    </header>
  );
}
