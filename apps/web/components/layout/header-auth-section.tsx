"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProfileRole } from "@service-time/types";
import { ProfileAvatar } from "@/components/layout/profile-avatar";
import { getProfileHomePath } from "@/lib/profile-home";
import { useLocale } from "@/lib/i18n/locale-context";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import { signOutAndRedirect } from "@/lib/sign-out-client";
import { createAuthBrowserClient } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

const HEADER_DARK = "#050B10";
const HEADER_MINT = "#94D4B9";
const RADIUS = "rounded-[20px]";

type HeaderProfile = {
  fullName: string;
  role: ProfileRole;
  avatarUrl: string | null;
};

const ctaButtonClass = cn(
  "inline-flex h-10 items-center justify-center px-5 text-sm font-semibold transition-opacity hover:opacity-90",
  RADIUS,
);

function registerButtonClass(isTransparent: boolean) {
  return cn(
    "inline-flex h-10 shrink-0 items-center justify-center border bg-transparent px-3 text-xs font-semibold whitespace-nowrap xl:px-5 xl:text-sm",
    "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(148,212,185,0.22)]",
    RADIUS,
    isTransparent
      ? "border-white/80 text-white hover:border-white hover:bg-white/10"
      : "border-[#94D4B9] text-[#94D4B9] hover:bg-[#94D4B9]/10",
  );
}

function GuestButtons({
  isTransparent,
  fullWidth,
  onNavigate,
  labels,
}: {
  isTransparent: boolean;
  fullWidth?: boolean;
  onNavigate?: () => void;
  labels: { register: string; login: string };
}) {
  if (fullWidth) {
    return (
      <div className="flex w-full flex-row gap-2">
        <Link
          href="/register"
          onClick={onNavigate}
          className={cn(
            registerButtonClass(isTransparent),
            "h-11 min-w-0 flex-1 px-2 text-center text-xs sm:text-sm",
          )}
        >
          {labels.register}
        </Link>
        <Link
          href="/login"
          onClick={onNavigate}
          className={cn(
            ctaButtonClass,
            "h-11 min-w-0 flex-1 px-2 text-center text-xs sm:text-sm",
          )}
          style={{
            backgroundColor: HEADER_MINT,
            color: HEADER_DARK,
          }}
        >
          {labels.login}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 xl:gap-2">
      <Link
        href="/register"
        onClick={onNavigate}
        className={registerButtonClass(isTransparent)}
      >
        {labels.register}
      </Link>
      <Link
        href="/login"
        onClick={onNavigate}
        className={cn(
          ctaButtonClass,
          "shrink-0 px-3 text-xs whitespace-nowrap xl:px-5 xl:text-sm",
        )}
        style={{
          backgroundColor: HEADER_MINT,
          color: HEADER_DARK,
        }}
      >
        {labels.login}
      </Link>
    </div>
  );
}

function UserProfileButton({
  profile,
  isTransparent,
  fullWidth,
  onNavigate,
  onSignOut,
  roleLabel,
  logoutLabel,
}: {
  profile: HeaderProfile;
  isTransparent: boolean;
  fullWidth?: boolean;
  onNavigate?: () => void;
  onSignOut: () => void;
  roleLabel: string;
  logoutLabel: string;
}) {
  const href = getProfileHomePath(profile.role);

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        fullWidth && "w-full flex-col",
      )}
    >
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          "inline-flex items-center gap-3 transition-all duration-300 hover:-translate-y-0.5",
          fullWidth
            ? cn(
                "h-12 w-full justify-start rounded-[20px] border border-[#94D4B9]/30 bg-[#94D4B9]/5 px-4",
              )
            : cn(
                "rounded-full py-1 pe-3 ps-1",
                isTransparent
                  ? "hover:bg-white/10"
                  : "hover:bg-[#94D4B9]/10",
              ),
        )}
        title={profile.fullName}
      >
        <ProfileAvatar
          fullName={profile.fullName}
          avatarUrl={profile.avatarUrl}
          size={fullWidth ? "md" : "md"}
        />
        <span className="min-w-0 text-start">
          <span
            className={cn(
              "block truncate text-sm font-semibold",
              isTransparent ? "text-white" : "text-[#94D4B9]",
            )}
          >
            {profile.fullName}
          </span>
          <span
            className={cn(
              "block text-xs",
              isTransparent ? "text-white/60" : "text-[#94D4B9]/70",
            )}
          >
            {roleLabel}
          </span>
        </span>
      </Link>

      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          onSignOut();
        }}
        className={cn(
          "inline-flex items-center justify-center gap-2 text-sm font-medium text-red-300 transition-colors hover:text-red-200",
          fullWidth
            ? "h-11 w-full rounded-[20px] border border-red-500/20 bg-red-500/10"
            : "rounded-full p-2 hover:bg-red-500/10",
        )}
        aria-label={logoutLabel}
        title={logoutLabel}
      >
        <LogOut className="size-4" aria-hidden />
        {fullWidth ? logoutLabel : null}
      </button>
    </div>
  );
}

export function HeaderAuthSection({
  isTransparent,
  variant = "desktop",
  onNavigate,
}: {
  isTransparent: boolean;
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { messages, locale } = useLocale();
  const [profile, setProfile] = useState<HeaderProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createAuthBrowserClient();

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setReady(true);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, full_name_ar, full_name_en, role, avatar_url, is_active")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.is_active && data.role) {
        setProfile({
          fullName: getProfileDisplayName(data, locale),
          role: data.role as ProfileRole,
          avatarUrl: data.avatar_url ?? null,
        });
      } else {
        setProfile(null);
      }

      setReady(true);
    }

    void loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadProfile();
    });

    return () => subscription.unsubscribe();
  }, [locale]);

  async function handleSignOut() {
    await signOutAndRedirect(router);
    setProfile(null);
  }

  if (!ready) {
    return variant === "desktop" ? (
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="h-10 w-[5.5rem] animate-pulse rounded-[20px] bg-white/5 xl:w-24" />
        <div className="h-10 w-14 animate-pulse rounded-[20px] bg-white/5 xl:w-20" />
      </div>
    ) : null;
  }

  if (profile) {
    return (
      <UserProfileButton
        profile={profile}
        isTransparent={isTransparent}
        fullWidth={variant === "mobile"}
        onNavigate={onNavigate}
        onSignOut={() => void handleSignOut()}
        roleLabel={messages.roles[profile.role]}
        logoutLabel={messages.auth.logout}
      />
    );
  }

  return (
    <GuestButtons
      isTransparent={isTransparent}
      fullWidth={variant === "mobile"}
      onNavigate={onNavigate}
      labels={
        variant === "mobile"
          ? {
              register: messages.auth.register,
              login: messages.auth.login,
            }
          : {
              register: messages.auth.headerRegister,
              login: messages.auth.headerLogin,
            }
      }
    />
  );
}
