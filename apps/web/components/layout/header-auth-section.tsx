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

const registerButtonClass = cn(
  "inline-flex h-10 items-center justify-center border border-[#94D4B9] bg-transparent px-5 text-sm font-semibold text-[#94D4B9]",
  "transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#94D4B9]/10 hover:shadow-[0_0_20px_rgba(148,212,185,0.22)]",
  RADIUS,
);

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
  return (
    <>
      <Link
        href="/register"
        onClick={onNavigate}
        className={cn(
          registerButtonClass,
          fullWidth && "mt-3 h-11 w-full",
        )}
      >
        {labels.register}
      </Link>
      <Link
        href="/login"
        onClick={onNavigate}
        className={cn(
          ctaButtonClass,
          fullWidth ? "mt-2 h-11 w-full" : undefined,
          isTransparent && !fullWidth && undefined,
        )}
        style={{
          backgroundColor: HEADER_MINT,
          color: HEADER_DARK,
        }}
      >
        {labels.login}
      </Link>
    </>
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
        fullWidth && "mt-3 w-full flex-col",
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
    const supabase = createAuthBrowserClient();
    await supabase.auth.signOut();
    setProfile(null);
    router.refresh();
    router.push("/");
  }

  if (!ready) {
    return variant === "desktop" ? (
      <div className="h-10 w-28 animate-pulse rounded-[20px] bg-white/5" />
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
      labels={messages.auth}
    />
  );
}
