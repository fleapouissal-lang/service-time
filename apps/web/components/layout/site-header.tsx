"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { HeaderAuthSection } from "@/components/layout/header-auth-section";
import { HeaderCartButton } from "@/components/spare-parts/header-cart-button";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const HEADER_BG = "bg-[#050B10]";
const HEADER_FG = "text-[#94D4B9]";
const RADIUS = "rounded-[20px]";
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
  const [open, setOpen] = useState(false);
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
          ? "bg-transparent"
          : cn("rounded-b-[20px]", HEADER_BG),
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

        <nav className="hidden items-center gap-2 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={navLinkClass(pathname === link.href, isTransparent)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <HeaderCartButton isTransparent={isTransparent} />
          <HeaderAuthSection isTransparent={isTransparent} variant="desktop" />
        </div>

        <button
          type="button"
          className={cn(
            "p-2 transition-colors duration-300 lg:hidden",
            isTransparent ? "text-white" : HEADER_FG,
          )}
          onClick={() => setOpen(!open)}
          aria-label="القائمة"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div
          className={cn(
            "border-t px-4 py-4 lg:hidden",
            isTransparent
              ? "border-white/15 bg-[#050B10]/95 backdrop-blur-sm"
              : cn("border-[#94D4B9]/15", HEADER_BG),
          )}
        >
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "px-3 py-2.5 text-sm transition-all duration-200",
                    isTransparent
                      ? active
                        ? "-translate-y-0.5 font-semibold text-[#94D4B9] underline decoration-2 underline-offset-4"
                        : "font-medium text-white hover:text-[#94D4B9]"
                      : cn(
                          HEADER_FG,
                          active
                            ? "-translate-y-0.5 font-semibold underline decoration-2 underline-offset-4"
                            : "font-medium hover:text-white",
                        ),
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <HeaderCartButton isTransparent={isTransparent} />
            <HeaderAuthSection
              isTransparent={isTransparent}
              variant="mobile"
              onNavigate={() => setOpen(false)}
            />
          </nav>
        </div>
      )}
    </header>
  );
}
