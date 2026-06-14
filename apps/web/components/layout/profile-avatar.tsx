"use client";

import { User } from "lucide-react";
import { useState } from "react";
import { resolveProfileAvatarSrc } from "@/lib/profile-avatar-url";
import { cn } from "@/lib/utils";

type ProfileAvatarProps = {
  userId?: string;
  fullName: string;
  avatarUrl?: string | null;
  avatarVersion?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClasses = {
  sm: "size-9 text-sm",
  md: "size-10 text-base",
  lg: "size-12 text-lg",
  xl: "size-14 text-xl",
};

export function ProfileAvatar({
  userId,
  fullName,
  avatarUrl,
  avatarVersion,
  size = "md",
  className,
}: ProfileAvatarProps) {
  const [failed, setFailed] = useState(false);
  const dim = sizeClasses[size];
  const initial = fullName.trim().charAt(0) || "?";
  const resolvedSrc =
    userId && avatarUrl?.trim() && !failed
      ? resolveProfileAvatarSrc(userId, avatarUrl, avatarVersion)
      : null;

  if (resolvedSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolvedSrc}
        alt=""
        onError={() => setFailed(true)}
        className={cn(
          "shrink-0 rounded-full object-cover ring-2 ring-[#94D4B9]/40",
          dim,
          className,
        )}
      />
    );
  }

  if (initial !== "?") {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-[#94D4B9]/15 font-bold text-[#94D4B9] ring-2 ring-[#94D4B9]/30",
          dim,
          className,
        )}
        aria-hidden
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[#94D4B9]/15 text-[#94D4B9] ring-2 ring-[#94D4B9]/30",
        dim,
        className,
      )}
      aria-hidden
    >
      <User
        className={
          size === "xl"
            ? "size-7"
            : size === "lg"
              ? "size-6"
              : size === "sm"
                ? "size-4"
                : "size-5"
        }
      />
    </div>
  );
}
