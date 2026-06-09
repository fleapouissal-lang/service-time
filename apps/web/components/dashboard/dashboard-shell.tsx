"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Profile } from "@service-time/types";
import {
  DashboardSidebar,
  type DashboardNavItem,
} from "@/components/dashboard/dashboard-sidebar";
import { DashboardMobileHeader } from "@/components/dashboard/dashboard-mobile-header";
import {
  getProfileHomePath,
  getProfilePagePath,
} from "@/lib/profile-home";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  getAdminNav,
  getClientNav,
  getTechnicianNav,
} from "@/lib/i18n/dashboard-nav";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import { signOutAndRedirect } from "@/lib/sign-out-client";

const STORAGE_KEY = "service-time-sidebar-open";

function useSidebarOpen() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setOpen(stored === "true");
  }, []);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return { open, toggle };
}

function DashboardLayout({
  children,
  profile,
  items,
  onSignOut,
}: {
  children: React.ReactNode;
  profile: Profile;
  items: DashboardNavItem[];
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const { open, toggle } = useSidebarOpen();
  const { locale } = useLocale();
  const displayName = getProfileDisplayName(profile, locale);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const sidebarUser = {
    fullName: displayName,
    role: profile.role,
    avatarUrl: profile.avatar_url ?? null,
    profileHref: getProfilePagePath(profile.role),
    homeHref: getProfileHomePath(profile.role),
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const handleMenuScroll = () => closeMobileMenu();
    const menuEl = menuRef.current;
    menuEl?.addEventListener("scroll", handleMenuScroll, { passive: true });
    window.addEventListener("wheel", handleMenuScroll, { passive: true });

    return () => {
      document.body.style.overflow = "";
      menuEl?.removeEventListener("scroll", handleMenuScroll);
      window.removeEventListener("wheel", handleMenuScroll);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background lg:flex-row">
      <DashboardMobileHeader
        open={mobileMenuOpen}
        onToggle={() => setMobileMenuOpen((value) => !value)}
      />

      {mobileMenuOpen ? (
        <div
          ref={menuRef}
          className="fixed inset-x-0 top-20 z-40 flex h-[calc(100dvh-5rem)] flex-col lg:hidden"
        >
          <DashboardSidebar
            user={sidebarUser}
            items={items}
            open
            onToggle={closeMobileMenu}
            onSignOut={onSignOut}
            mobileMenu
            onNavigate={closeMobileMenu}
          />
        </div>
      ) : null}

      <div className="hidden h-full shrink-0 lg:block">
        <DashboardSidebar
          user={sidebarUser}
          items={items}
          open={open}
          onToggle={toggle}
          onSignOut={onSignOut}
        />
      </div>

      <main className="scrollbar-theme min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}

export function AdminDashboardShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: Profile;
}) {
  const router = useRouter();
  const { messages } = useLocale();

  async function signOut() {
    await signOutAndRedirect(router);
  }

  return (
    <DashboardLayout
      profile={profile}
      items={getAdminNav(messages)}
      onSignOut={() => void signOut()}
    >
      {children}
    </DashboardLayout>
  );
}

export function TechnicianDashboardShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: Profile;
}) {
  const router = useRouter();
  const { messages } = useLocale();

  async function signOut() {
    await signOutAndRedirect(router);
  }

  return (
    <DashboardLayout
      profile={profile}
      items={getTechnicianNav(messages)}
      onSignOut={() => void signOut()}
    >
      {children}
    </DashboardLayout>
  );
}

export function ClientDashboardShell({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: Profile;
}) {
  const router = useRouter();
  const { messages } = useLocale();

  async function signOut() {
    await signOutAndRedirect(router);
  }

  return (
    <DashboardLayout
      profile={profile}
      items={getClientNav(messages)}
      onSignOut={() => void signOut()}
    >
      {children}
    </DashboardLayout>
  );
}
