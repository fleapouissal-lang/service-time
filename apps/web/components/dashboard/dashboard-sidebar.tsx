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
  fullName: string;
  role: ProfileRole;
  avatarUrl: string | null;
  profileHref: string;
  homeHref: string;
};

const SIDEBAR_EXPANDED = "18rem";
const SIDEBAR_COLLAPSED = "4.75rem";
const SIDEBAR_BG = "#94D4B9";
const SIDEBAR_FG = "#050B10";

export function DashboardSidebar({
  user,
  items,
  open,
  onToggle,
  onSignOut,
}: {
  user: DashboardUser;
  items: DashboardNavItem[];
  open: boolean;
  onToggle: () => void;
  onSignOut?: () => void;
}) {
  const pathname = usePathname();
  const { messages } = useLocale();

  const profileBlock = (compact: boolean) => (
    <div className={cn("space-y-2", compact ? "w-full" : "w-full")}>
      <Link
        href={user.profileHref}
        title={user.fullName}
        className={cn(
          "transition-opacity hover:opacity-90",
          compact
            ? "flex items-center justify-center"
            : "flex w-full items-center gap-5 px-1 py-1",
        )}
      >
        <ProfileAvatar
          fullName={user.fullName}
          avatarUrl={user.avatarUrl}
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
      className="relative h-full shrink-0 overflow-visible transition-[width] duration-300 ease-in-out"
      style={{ width: open ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED }}
    >
      <aside
        className={cn(
          "flex h-full flex-col overflow-hidden transition-[width] duration-300 ease-in-out",
          "rounded-tl-[20px] rounded-bl-[20px]",
          "border-l border-[#050B10]/10 text-[#050B10]",
        )}
        style={{
          width: open ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED,
          backgroundColor: SIDEBAR_BG,
          color: SIDEBAR_FG,
        }}
      >
        <div
          className={cn(
            "border-b border-[#050B10]/10 transition-all duration-300",
            open ? "space-y-4 px-3 py-5" : "flex flex-col items-center px-2 py-4",
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex items-center justify-center bg-transparent",
              open ? "w-full" : "",
            )}
            title="Service Time"
          >
            {open ? (
              <Image
                src="/logos/banner.png"
                alt="Service Time — سيرفيس تايم"
                width={280}
                height={72}
                className="h-[4.25rem] w-full max-w-full object-contain object-center brightness-[1.08] contrast-[1.05]"
                unoptimized
                priority
              />
            ) : (
              <Image
                src="/logos/icon-removebg-preview.png"
                alt="Service Time"
                width={52}
                height={52}
                className="size-[3.25rem] object-contain"
                unoptimized
              />
            )}
          </Link>

          {open ? profileBlock(false) : null}
          {open ? (
            <div className="flex justify-center">
              <LanguageSwitcher className="text-[#050B10] hover:bg-[#050B10]/10" />
            </div>
          ) : (
            <LanguageSwitcher className="text-[#050B10] hover:bg-[#050B10]/10" />
          )}
        </div>

        <nav
          className={cn(
            "flex-1 overflow-y-auto py-3",
            open ? "space-y-1 px-2" : "flex flex-col items-center gap-2 px-2",
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
                title={!open ? item.label : undefined}
                aria-label={item.label}
                className={cn(
                  "font-medium transition-all duration-200",
                  open
                    ? "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm"
                    : "flex size-11 items-center justify-center rounded-xl",
                  active
                    ? "bg-[#050B10] text-[#94D4B9] shadow-[0_4px_14px_rgba(5,11,16,0.18)]"
                    : "text-[#050B10]/85 hover:bg-[#050B10]/10 hover:text-[#050B10]",
                )}
              >
                <item.icon
                  className={cn("shrink-0", open ? "size-4" : "size-5")}
                />
                {open && <span className="flex-1 truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            "mt-auto border-t border-[#050B10]/10",
            open ? "px-2 py-3" : "flex flex-col items-center gap-2 px-2 py-3",
          )}
        >
          {!open ? profileBlock(true) : null}
          {onSignOut ? (
            <button
              type="button"
              onClick={onSignOut}
              title={messages.auth.logout}
              aria-label={messages.auth.logout}
              className={cn(
                "font-medium text-red-800 transition-colors hover:bg-red-900/10 hover:text-red-900",
                open
                  ? "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm"
                  : "flex size-11 items-center justify-center rounded-xl",
              )}
            >
              <LogOut className={cn("shrink-0", open ? "size-4" : "size-5")} />
              {open && (
                <span className="flex-1 text-start">{messages.auth.logout}</span>
              )}
            </button>
          ) : null}
        </div>
      </aside>

      <SidebarEdgeToggle open={open} onToggle={onToggle} />
    </div>
  );
}

export const ADMIN_NAV: DashboardNavItem[] = [];
export const TECHNICIAN_NAV: DashboardNavItem[] = [];
export const CLIENT_NAV: DashboardNavItem[] = [];
