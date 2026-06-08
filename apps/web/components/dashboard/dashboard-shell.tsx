"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@service-time/types";
import {
  DashboardSidebar,
  type DashboardNavItem,
} from "@/components/dashboard/dashboard-sidebar";
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
import { createAuthBrowserClient } from "@/lib/supabase-browser";

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
  const { open, toggle } = useSidebarOpen();
  const { locale } = useLocale();
  const displayName = getProfileDisplayName(profile, locale);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <DashboardSidebar
        user={{
          fullName: displayName,
          role: profile.role,
          avatarUrl: profile.avatar_url ?? null,
          profileHref: getProfilePagePath(profile.role),
          homeHref: getProfileHomePath(profile.role),
        }}
        items={items}
        open={open}
        onToggle={toggle}
        onSignOut={onSignOut}
      />
      <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
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
    const supabase = createAuthBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
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
    const supabase = createAuthBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
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
    const supabase = createAuthBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
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
