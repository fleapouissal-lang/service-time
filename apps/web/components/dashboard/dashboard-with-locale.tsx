"use client";

import type { Profile } from "@service-time/types";
import type { Locale } from "@/lib/i18n/config";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import {
  AdminDashboardShell,
  ClientDashboardShell,
  TechnicianDashboardShell,
} from "@/components/dashboard/dashboard-shell";

type DashboardWithLocaleProps = {
  locale: Locale;
  profile: Profile;
  children: React.ReactNode;
};

function DashboardLocaleBoundary({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleProvider locale={locale}>{children}</LocaleProvider>;
}

export function AdminDashboardWithLocale({
  locale,
  profile,
  children,
}: DashboardWithLocaleProps) {
  return (
    <DashboardLocaleBoundary locale={locale}>
      <AdminDashboardShell profile={profile}>{children}</AdminDashboardShell>
    </DashboardLocaleBoundary>
  );
}

export function ClientDashboardWithLocale({
  locale,
  profile,
  children,
}: DashboardWithLocaleProps) {
  return (
    <DashboardLocaleBoundary locale={locale}>
      <ClientDashboardShell profile={profile}>{children}</ClientDashboardShell>
    </DashboardLocaleBoundary>
  );
}

export function TechnicianDashboardWithLocale({
  locale,
  profile,
  children,
}: DashboardWithLocaleProps) {
  return (
    <DashboardLocaleBoundary locale={locale}>
      <TechnicianDashboardShell profile={profile}>
        {children}
      </TechnicianDashboardShell>
    </DashboardLocaleBoundary>
  );
}
