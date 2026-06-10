"use client";

import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileAccountButton } from "@/components/layout/mobile-account-button";
import { getDashboardRoleFromPath } from "@/lib/i18n/mobile-dashboard-nav";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function DashboardMobileHeader() {
  const pathname = usePathname();
  const dashboardRole = getDashboardRoleFromPath(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 shrink-0 border-b border-[#94D4B9]/15 bg-[#050B10] lg:hidden",
      )}
    >
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex shrink-0 items-center bg-transparent">
          <Image
            src="/logos/logo-ar.png"
            alt="Service Time — سيرفيس تايم"
            width={280}
            height={98}
            className="h-10 w-auto object-contain brightness-[1.15] contrast-[1.08]"
            priority
            unoptimized
          />
        </Link>

        <div className="flex items-center gap-1.5">
          <LanguageSwitcher compact />
          <MobileAccountButton dashboardRole={dashboardRole} />
        </div>
      </div>
    </header>
  );
}
