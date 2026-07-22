"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
} from "lucide-react";
import type { ProfileRole } from "@service-time/types";
import { ProfileAvatar } from "@/components/layout/profile-avatar";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SidebarDateTime } from "@/components/dashboard/sidebar-datetime";
import { SidebarEdgeToggle } from "@/components/dashboard/sidebar-edge-toggle";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type DashboardUser = {
  userId: string;
  fullName: string;
  role: ProfileRole;
  avatarUrl: string | null;
  avatarVersion?: string | null;
  profileHref: string;
  homeHref: string;
};

const SIDEBAR_EXPANDED = "18rem";
const SIDEBAR_COLLAPSED = "4.75rem";
const SIDEBAR_BG = "#2DB87A";
const SIDEBAR_FG = "#050B10";

export function DashboardSidebar({
  user,
  items,
  open,
  onToggle,
  onSignOut,
  mobileMenu = false,
  onNavigate,
}: {
  user: DashboardUser;
  items: DashboardNavItem[];
  open: boolean;
  onToggle: () => void;
  onSignOut?: () => void;
  mobileMenu?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { messages, locale } = useLocale();
  const isExpanded = mobileMenu || open;

  const profileBlock = (compact: boolean) => (
    <div className={cn("space-y-2", compact ? "w-full" : "w-full")}>
      <Link
        href={user.profileHref}
        title={user.fullName}
        onClick={() => onNavigate?.()}
        className={cn(
          "transition-opacity hover:opacity-90",
          compact
            ? "flex items-center justify-center"
            : "flex w-full items-center gap-5 px-1 py-1",
        )}
      >
        <ProfileAvatar
          userId={user.userId}
          fullName={user.fullName}
          avatarUrl={user.avatarUrl}
          avatarVersion={user.avatarVersion}
          size="lg"
          className="!bg-[#050B10]/10 !text-[#050B10] ring-[#050B10]/20"
        />
        {!compact ? (
          <span className="min-w-0 flex-1 text-start">
            <span className="block truncate text-base font-semibold text-[#050B10]">
              {user.fullName}
            </span>
            <span className="mt-0.5 block text-sm text-[#050B10]/70">
              {messages.roles[user.role]}
            </span>
          </span>
        ) : null}
      </Link>
      <SidebarDateTime compact={compact} />
    </div>
  );

  return (
    <div
      className={cn(
        "relative h-full shrink-0 overflow-visible transition-[width] duration-300 ease-in-out",
        !mobileMenu && "bg-[var(--dashboard-content-bg)]",
        mobileMenu && "w-full",
      )}
      style={mobileMenu ? undefined : { width: open ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED }}
    >
      <aside
        className={cn(
          "flex h-full flex-col overflow-hidden transition-[width] duration-300 ease-in-out",
          "text-[#050B10]",
          mobileMenu
            ? "w-full rounded-none"
            : locale === "ar"
              ? "rounded-tl-[20px] rounded-bl-[20px]"
              : "rounded-tr-[20px] rounded-br-[20px]",
        )}
        style={{
          width: mobileMenu
            ? "100%"
            : open
              ? SIDEBAR_EXPANDED
              : SIDEBAR_COLLAPSED,
          backgroundColor: SIDEBAR_BG,
          color: SIDEBAR_FG,
        }}
      >
        <div
          className={cn(
            "border-b border-[#050B10]/10 transition-all duration-300",
            isExpanded ? "space-y-4 px-3 py-5" : "flex flex-col items-center px-2 py-4",
          )}
        >
          {!mobileMenu ? (
            <Link
              href="/"
              className={cn(
                "flex items-center justify-center bg-transparent",
                isExpanded ? "w-full" : "",
              )}
              title="Service Time"
            >
              {isExpanded ? (
                <Image
                  src="/logos/banner.png"
                  alt="Service Time — سيرفيس تايم"
                  width={280}
                  height={72}
                  className="h-[4.25rem] w-full max-w-full object-contain object-center brightness-[1.08] contrast-[1.05]"
                  priority
                />
              ) : (
                <Image
                  src="/logos/icon-removebg-preview.png"
                  alt="Service Time"
                  width={52}
                  height={52}
                  className="size-[3.25rem] object-contain"
                />
              )}
            </Link>
          ) : null}

          {isExpanded ? profileBlock(false) : null}
          {isExpanded ? (
            <div className="flex items-center justify-center gap-2">
              <ThemeToggle tone="light" compact />
              <LanguageSwitcher tone="light" />
            </div>
          ) : (
            !mobileMenu ? (
              <div className="flex flex-col items-center gap-2">
                <ThemeToggle tone="light" compact />
                <LanguageSwitcher tone="light" />
              </div>
            ) : null
          )}
        </div>

        <nav
          className={cn(
            "scrollbar-theme flex-1 overflow-y-auto py-3",
            isExpanded ? "space-y-1 px-2" : "flex flex-col items-center gap-2 px-2",
          )}
        >
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" &&
                item.href !== "/technician" &&
                item.href !== "/client" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={!isExpanded ? item.label : undefined}
                aria-label={item.label}
                onClick={() => onNavigate?.()}
                className={cn(
                  "font-medium transition-all duration-200",
                  isExpanded
                    ? "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm"
                    : "flex size-11 items-center justify-center rounded-xl",
                  active
                    ? "bg-[#050B10] text-[#94D4B9] shadow-[0_4px_14px_rgba(5,11,16,0.18)]"
                    : "text-[#050B10]/85 hover:bg-[#050B10]/10 hover:text-[#050B10]",
                )}
              >
                <item.icon
                  className={cn("shrink-0", isExpanded ? "size-4" : "size-5")}
                />
                {isExpanded && <span className="flex-1 truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            "mt-auto border-t border-[#050B10]/10",
            isExpanded ? "px-2 py-3" : "flex flex-col items-center gap-2 px-2 py-3",
          )}
        >
          {!isExpanded ? profileBlock(true) : null}
          {onSignOut ? (
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                onSignOut();
              }}
              title={messages.auth.logout}
              aria-label={messages.auth.logout}
              className={cn(
                "font-medium text-red-800 transition-colors hover:bg-red-900/10 hover:text-red-900",
                isExpanded
                  ? "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm"
                  : "flex size-11 items-center justify-center rounded-xl",
              )}
            >
              <LogOut className={cn("shrink-0", isExpanded ? "size-4" : "size-5")} />
              {isExpanded && (
                <span className="flex-1 text-start">{messages.auth.logout}</span>
              )}
            </button>
          ) : null}
        </div>
      </aside>

      {!mobileMenu ? <SidebarEdgeToggle open={open} onToggle={onToggle} /> : null}
    </div>
  );
}

export const ADMIN_NAV: DashboardNavItem[] = [];
export const TECHNICIAN_NAV: DashboardNavItem[] = [];
export const CLIENT_NAV: DashboardNavItem[] = [];
