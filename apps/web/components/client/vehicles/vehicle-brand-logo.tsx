"use client";

import Image from "next/image";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";

type VehicleBrandLogoProps = {
  src: string | null;
  alt?: string | null;
  size?: "sm" | "md" | "lg";
  variant?: "inline" | "hero";
  className?: string;
};

const sizeClass = {
  sm: "size-10",
  md: "size-14",
  lg: "size-16",
} as const;

export function VehicleBrandLogo({
  src,
  alt,
  size = "md",
  variant = "inline",
  className,
}: VehicleBrandLogoProps) {
  const label = alt?.trim() || "";
  const fallbackLetter = label ? label.charAt(0).toUpperCase() : null;

  return (
    <div
      className={cn(
        "vehicle-brand-logo flex shrink-0 items-center justify-center overflow-hidden",
        variant === "hero"
          ? "h-full w-full bg-transparent p-0 shadow-none"
          : "rounded-xl bg-white p-1.5 shadow-sm",
        variant === "inline" && sizeClass[size],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={label || "Vehicle brand"}
          width={variant === "hero" ? 160 : 56}
          height={variant === "hero" ? 96 : 56}
          className={cn(
            "object-contain",
            variant === "hero" ? "h-20 w-auto max-w-[75%] sm:h-24" : "h-full w-full",
          )}
        />
      ) : fallbackLetter ? (
        <span className="text-lg font-bold text-[#050b10]">{fallbackLetter}</span>
      ) : (
        <Car className="size-5 text-[#050b10]" aria-hidden />
      )}
    </div>
  );
}
