"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProfileRole } from "@service-time/types";
import {
  getDashboardMobileNav,
  getDashboardRoleFromPath,
  isDashboardNavActive,
} from "@/lib/i18n/mobile-dashboard-nav";
import {
  getMobileBottomTabs,
  getMobileMoreLinks,
  isMobileMoreActive,
} from "@/lib/i18n/mobile-nav";
import { useLocale } from "@/lib/i18n/locale-context";
import { shouldShowMobileBottomNav, MOBILE_BOTTOM_NAV_RESERVE } from "@/lib/mobile-nav-layout";
import { cn } from "@/lib/utils";

function CenterOverviewFab({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      data-nav-active={active ? "true" : undefined}
      className="absolute left-1/2 top-0 z-30 flex -translate-x-1/2 -translate-y-[45%] flex-col items-center"
    >
      <span
        className={cn(
          "flex size-[3.75rem] items-center justify-center rounded-full bg-[#94D4B9] text-[#050B10]",
          "border-4 border-white/90 shadow-[0_8px_24px_rgba(148,212,185,0.42)] transition-transform duration-200",
          active ? "scale-105" : "active:scale-95",
        )}
      >
        <Icon className="size-6" strokeWidth={2.4} />
      </span>
      <span
        className={cn(
          "mt-1 max-w-[5rem] truncate px-0.5 text-[11px] leading-none mobile-bottom-nav__fab-label",
          active && "mobile-bottom-nav__fab-label--active",
        )}
      >
        {label}
      </span>
    </Link>
  );
}

function TabLink({
  href,
  label,
  icon: Icon,
  active,
  compact,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      data-nav-active={active ? "true" : undefined}
      className="flex shrink-0 flex-col items-center gap-0.5"
    >
      <span
        className={cn(
          "mobile-bottom-nav__icon-wrap relative flex items-center justify-center rounded-full",
          compact ? "size-8 mobile-bottom-nav__icon-wrap--compact" : "size-9",
          active && "mobile-bottom-nav__icon-wrap--active",
        )}
      >
        <Icon className={compact ? "size-4" : "size-5"} strokeWidth={active ? 2.5 : 2.25} />
      </span>
      <span
        className={cn(
          "mobile-bottom-nav__label max-w-full truncate px-0.5 text-[10px] leading-tight",
          compact && "mobile-bottom-nav__label--compact",
          active && "mobile-bottom-nav__label--active",
        )}
      >
        {label}
      </span>
    </Link>
  );
}

function SheetOverlay({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] lg:hidden"
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-[59] lg:hidden",
          "mobile-bottom-sheet bg-mobile-bottom-nav rounded-t-[20px]",
          MOBILE_BOTTOM_NAV_RESERVE,
        )}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <div className="px-4 pt-3 pb-3">
          {children}
        </div>
      </div>
    </>
  );
}

function SheetHeader({
  title,
  onClose,
  closeLabel,
}: {
  title: string;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <>
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#050B10]/15" />
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#050B10]">{title}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-[#050B10]/70 transition-colors hover:bg-[#050B10]/10 hover:text-[#050B10]"
          aria-label={closeLabel}
        >
          <X className="size-5" />
        </button>
      </div>
    </>
  );
}

function SheetNavList({ children }: { children: React.ReactNode }) {
  return (
    <nav className="grid max-h-[min(46dvh,18rem)] gap-1 overflow-y-auto overscroll-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </nav>
  );
}

function NavSheetLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
        active
          ? "bg-[#050B10]/10 text-[#050B10] font-semibold"
          : "text-[#050B10]/80 hover:bg-[#050B10]/5",
      )}
    >
      <Icon className="size-5 shrink-0" />
      {label}
    </Link>
  );
}

function MoreTabButton({
  label,
  active,
  open,
  onClick,
}: {
  label: string;
  active: boolean;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-nav-active={active || open ? "true" : undefined}
      className="flex shrink-0 flex-col items-center gap-0.5"
      aria-expanded={open}
      aria-haspopup="dialog"
    >
      <span
        className={cn(
          "mobile-bottom-nav__icon-wrap relative flex size-9 items-center justify-center rounded-full",
          (active || open) && "mobile-bottom-nav__icon-wrap--active",
        )}
      >
        <LayoutGrid className="size-5" strokeWidth={active || open ? 2.5 : 2.25} />
      </span>
      <span
        className={cn(
          "mobile-bottom-nav__label max-w-full truncate px-0.5 text-[10px] leading-tight",
          (active || open) && "mobile-bottom-nav__label--active",
        )}
      >
        {label}
      </span>
    </button>
  );
}

function BottomBarShell({
  center,
  children,
  ariaLabel,
}: {
  center?: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    active: boolean;
  };
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[60] lg:hidden"
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          "mobile-bottom-nav bg-mobile-bottom-nav relative w-full overflow-visible border-t border-[rgba(5,11,16,0.12)]",
          "rounded-t-[20px]",
          center ? "pt-3" : "pt-2.5",
          "pb-[calc(0.625rem+env(safe-area-inset-bottom))]",
        )}
      >
        {center ? (
          <CenterOverviewFab
            href={center.href}
            label={center.label}
            icon={center.icon}
            active={center.active}
          />
        ) : null}

        <div className="relative z-10 mx-auto flex h-[3.25rem] w-full max-w-lg items-center justify-evenly px-2">
          {children}
        </div>
      </div>
    </nav>
  );
}

function NavSlot({
  children,
  centerSpacer,
}: {
  children?: React.ReactNode;
  centerSpacer?: boolean;
}) {
  if (centerSpacer) {
    return <div aria-hidden className="min-w-0 flex-1" />;
  }

  return (
    <div className="flex min-w-0 flex-1 justify-center">
      {children}
    </div>
  );
}

function DashboardBottomBar({
  role,
  pathname,
  moreOpen,
  setMoreOpen,
}: {
  role: ProfileRole;
  pathname: string;
  moreOpen: boolean;
  setMoreOpen: (open: boolean) => void;
}) {
  const { messages } = useLocale();
  const { primary, overflow, center } = getDashboardMobileNav(role, messages);
  const showMore = overflow.length > 0;
  const moreActive = overflow.some((item) =>
    isDashboardNavActive(pathname, item.href),
  );

  const closeMore = () => setMoreOpen(false);
  const leadingItems = center ? primary.slice(0, 2) : primary.slice(0, 3);
  const trailingItems = center ? primary.slice(2) : primary.slice(3);
  const tabCount =
    leadingItems.length + trailingItems.length + (showMore ? 1 : 0);
  const compact = tabCount >= 5;

  return (
    <>
      <SheetOverlay open={moreOpen} onClose={closeMore} label={messages.nav.more}>
        <SheetHeader
          title={messages.nav.more}
          onClose={closeMore}
          closeLabel={messages.common.close}
        />
        <SheetNavList>
          {overflow.map((item) => (
            <NavSheetLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isDashboardNavActive(pathname, item.href)}
              onNavigate={closeMore}
            />
          ))}
        </SheetNavList>
      </SheetOverlay>

      <BottomBarShell
        ariaLabel={messages.nav.mobileNavLabel}
        center={
          center
            ? {
                href: center.href,
                label: center.label,
                icon: center.icon,
                active: isDashboardNavActive(pathname, center.href),
              }
            : undefined
        }
      >
        {leadingItems.map((item) => (
          <NavSlot key={item.href}>
            <TabLink
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isDashboardNavActive(pathname, item.href)}
              compact={compact}
            />
          </NavSlot>
        ))}

        {center ? <NavSlot centerSpacer /> : null}

        {trailingItems.map((item) => (
          <NavSlot key={item.href}>
            <TabLink
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isDashboardNavActive(pathname, item.href)}
              compact={compact}
            />
          </NavSlot>
        ))}

        {showMore ? (
          <NavSlot>
            <MoreTabButton
              label={messages.nav.more}
              active={moreActive}
              open={moreOpen}
              onClick={() => setMoreOpen(true)}
            />
          </NavSlot>
        ) : null}
      </BottomBarShell>
    </>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { messages } = useLocale();
  const [moreOpen, setMoreOpen] = useState(false);

  const dashboardRole = getDashboardRoleFromPath(pathname);
  const showNav = shouldShowMobileBottomNav(pathname);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [moreOpen]);

  if (!showNav) {
    return null;
  }

  if (dashboardRole) {
    return (
      <DashboardBottomBar
        role={dashboardRole}
        pathname={pathname}
        moreOpen={moreOpen}
        setMoreOpen={setMoreOpen}
      />
    );
  }

  const publicTabs = getMobileBottomTabs(messages);
  const publicMoreLinks = getMobileMoreLinks(messages);
  const publicMoreActive = isMobileMoreActive(pathname);
  const closeMore = () => setMoreOpen(false);

  const leadingTabs = publicTabs.filter((tab) => !tab.center).slice(0, 2);
  const centerTab = publicTabs.find((tab) => tab.center);
  const trailingTabs = publicTabs.filter((tab) => !tab.center).slice(2);

  return (
    <>
      <SheetOverlay open={moreOpen} onClose={closeMore} label={messages.nav.more}>
        <SheetHeader
          title={messages.nav.more}
          onClose={closeMore}
          closeLabel={messages.common.close}
        />
        <SheetNavList>
          {publicMoreLinks.map((link) => (
            <NavSheetLink
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              active={
                pathname === link.href ||
                pathname.startsWith(`${link.href}/`)
              }
              onNavigate={closeMore}
            />
          ))}
        </SheetNavList>
      </SheetOverlay>

      <BottomBarShell
        ariaLabel={messages.nav.mobileNavLabel}
        center={
          centerTab
            ? {
                href: centerTab.href,
                label: centerTab.label,
                icon: centerTab.icon,
                active: centerTab.match(pathname),
              }
            : undefined
        }
      >
        {leadingTabs.map((tab) => (
          <NavSlot key={tab.href}>
            <TabLink
              href={tab.href}
              label={tab.label}
              icon={tab.icon}
              active={tab.match(pathname)}
            />
          </NavSlot>
        ))}

        {centerTab ? <NavSlot centerSpacer /> : null}

        {trailingTabs.map((tab) => (
          <NavSlot key={tab.href}>
            <TabLink
              href={tab.href}
              label={tab.label}
              icon={tab.icon}
              active={tab.match(pathname)}
            />
          </NavSlot>
        ))}

        <NavSlot>
          <MoreTabButton
            label={messages.nav.more}
            active={publicMoreActive}
            open={moreOpen}
            onClick={() => setMoreOpen(true)}
          />
        </NavSlot>
      </BottomBarShell>
    </>
  );
}
