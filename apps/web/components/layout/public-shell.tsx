"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WhatsAppFloatButton } from "@/components/layout/whatsapp-float-button";
import {
  MOBILE_BOTTOM_BAR_PADDING,
  shouldShowMobileBottomNav,
} from "@/lib/mobile-nav-layout";

const DASHBOARD_PREFIXES = ["/admin", "/technician", "/client", "/login"];

type PublicShellProps = {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
};

export function PublicShell({ children, header, footer }: PublicShellProps) {
  const pathname = usePathname();
  const isDashboard = DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p));
  const showMobileNav = shouldShowMobileBottomNav(pathname);
  const isHome = pathname === "/";

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      <main
        className={
          showMobileNav
            ? cn(
                "flex-1 bg-site-main",
                MOBILE_BOTTOM_BAR_PADDING,
                "lg:pb-0",
                isHome &&
                  "max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:overflow-hidden max-md:pb-0 max-md:bg-transparent",
              )
            : "flex-1 bg-site-main"
        }
      >
        {children}
      </main>
      <div
        className={cn(
          showMobileNav && MOBILE_BOTTOM_BAR_PADDING,
          "hidden lg:pb-0 md:block",
        )}
      >
        {footer}
      </div>
      <WhatsAppFloatButton />
    </>
  );
}
