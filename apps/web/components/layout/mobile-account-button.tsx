"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, LogOut, MapPin, Settings, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProfileRole } from "@service-time/types";
import { ProfileAvatar } from "@/components/layout/profile-avatar";
import { useAuthProfile } from "@/lib/hooks/use-auth-profile";
import { useLocale } from "@/lib/i18n/locale-context";
import {
  getProfileHomePath,
  getProfilePagePath,
} from "@/lib/profile-home";
import { iconAccentClass } from "@/lib/card-surface";
import { signOutAndRedirect } from "@/lib/sign-out-client";
import { cn } from "@/lib/utils";

function AccountSheetLink({
  href,
  label,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-white/85 transition-colors hover:bg-white/5"
    >
      <Icon className={cn("size-5 shrink-0", iconAccentClass)} />
      {label}
    </Link>
  );
}

function AccountSheetContent({
  role,
  userId,
  fullName,
  avatarUrl,
  avatarVersion,
  onClose,
  onSignOut,
}: {
  role: ProfileRole | null;
  userId: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  avatarVersion?: string | null;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const { messages } = useLocale();

  if (role && fullName) {
    return (
      <div className="grid gap-1">
        <div className="mb-2 flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3">
          <ProfileAvatar
            userId={userId ?? undefined}
            fullName={fullName}
            avatarUrl={avatarUrl}
            avatarVersion={avatarVersion}
            size="md"
          />
          <div className="min-w-0 text-start">
            <p className="truncate font-semibold text-white">{fullName}</p>
            <p className="text-xs text-white/60">{messages.roles[role]}</p>
          </div>
        </div>

        <AccountSheetLink
          href={getProfileHomePath(role)}
          label={messages.mobileNav.dashboard}
          icon={LayoutGrid}
          onNavigate={onClose}
        />
        {role === "client" ? (
          <AccountSheetLink
            href="/client/track"
            label={messages.mobileNav.trackOrder}
            icon={MapPin}
            onNavigate={onClose}
          />
        ) : null}
        <AccountSheetLink
          href={getProfilePagePath(role)}
          label={messages.mobileNav.accountSettings}
          icon={Settings}
          onNavigate={onClose}
        />

        <button
          type="button"
          onClick={() => {
            onClose();
            onSignOut();
          }}
          className="mt-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
        >
          <LogOut className="size-5 shrink-0" />
          {messages.auth.logout}
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Link
        href="/login"
        onClick={onClose}
        className="flex h-11 items-center justify-center rounded-[20px] bg-[var(--site-header-btn-filled-bg)] text-sm font-semibold text-[var(--site-header-btn-filled-text)]"
      >
        {messages.auth.login}
      </Link>
      <Link
        href="/register"
        onClick={onClose}
        className="flex h-11 items-center justify-center rounded-[20px] border border-[var(--site-header-btn-outline-border)] bg-transparent text-sm font-semibold text-[var(--site-header-btn-outline-text)]"
      >
        {messages.auth.register}
      </Link>
    </div>
  );
}

type MobileAccountButtonProps = {
  isTransparent?: boolean;
  tone?: "dark" | "light";
  dashboardRole?: ProfileRole | null;
};

export function MobileAccountButton({
  isTransparent = false,
  tone = "dark",
  dashboardRole = null,
}: MobileAccountButtonProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { messages, locale } = useLocale();
  const { profile } = useAuthProfile(locale);
  const [open, setOpen] = useState(false);

  const isLight = tone === "light";
  const role = profile?.role ?? dashboardRole;
  const userId = profile?.userId ?? null;
  const fullName = profile?.fullName ?? null;
  const avatarUrl = profile?.avatarUrl ?? null;
  const avatarVersion = profile?.avatarVersion ?? null;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function handleSignOut() {
    await signOutAndRedirect(router);
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label={messages.common.close}
          className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {open ? (
        <div
          className="fixed inset-x-0 top-0 z-[70] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={messages.mobileNav.profileMenu}
        >
          <div className="mx-3 mt-3 rounded-[20px] border border-[#94D4B9]/15 bg-[#050B10]/98 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#94D4B9]">
                {messages.nav.profile}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={messages.common.close}
              >
                <X className="size-5" />
              </button>
            </div>
            <AccountSheetContent
              role={role}
              userId={userId}
              fullName={fullName}
              avatarUrl={avatarUrl}
              avatarVersion={avatarVersion}
              onClose={() => setOpen(false)}
              onSignOut={() => void handleSignOut()}
            />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={messages.nav.profile}
        title={messages.nav.profile}
        className={cn(
          "relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full transition-colors",
          isLight
            ? "text-[#050B10] hover:bg-[#050B10]/10"
            : isTransparent
              ? "header-chrome-text hover:bg-[color-mix(in_srgb,var(--header-chrome-surface-bg)_60%,var(--header-chrome-fg)_40%)]"
              : "text-[#94D4B9] hover:bg-[#94D4B9]/10",
        )}
      >
        {fullName ? (
          <ProfileAvatar
            userId={userId ?? undefined}
            fullName={fullName}
            avatarUrl={avatarUrl}
            avatarVersion={avatarVersion}
            size="sm"
            className="!size-10 !text-sm ring-2 ring-[color:var(--header-chrome-border,var(--site-header-btn-outline-border))]"
          />
        ) : (
          <User className="size-5" strokeWidth={2} />
        )}
      </button>
    </>
  );
}
