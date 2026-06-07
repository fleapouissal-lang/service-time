import { User } from "lucide-react";
import { cn } from "@/lib/utils";

type ProfileAvatarProps = {
  fullName: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "size-9 text-sm",
  md: "size-10 text-base",
  lg: "size-12 text-lg",
};

export function ProfileAvatar({
  fullName,
  avatarUrl,
  size = "md",
  className,
}: ProfileAvatarProps) {
  const dim = sizeClasses[size];
  const initial = fullName.trim().charAt(0) || "?";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
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
          size === "lg" ? "size-6" : size === "sm" ? "size-4" : "size-5"
        }
      />
    </div>
  );
}
