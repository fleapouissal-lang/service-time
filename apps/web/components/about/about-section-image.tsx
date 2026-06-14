"use client";

import Image from "next/image";
import { useTheme } from "@/lib/theme/theme-context";
import { cn } from "@/lib/utils";

type AboutSectionImageProps = {
  imageSrc: string;
  imageSrcLight?: string;
  imageAlt: string;
  overlayClassName?: string;
  overlayClassNameLight?: string;
};

export function AboutSectionImage({
  imageSrc,
  imageSrcLight,
  imageAlt,
  overlayClassName = "bg-black/55",
  overlayClassNameLight = "about-section-image__overlay--light",
}: AboutSectionImageProps) {
  const { theme } = useTheme();
  const useLightImage = theme === "light" && Boolean(imageSrcLight);
  const src = useLightImage ? imageSrcLight! : imageSrc;
  const overlay = useLightImage
    ? overlayClassNameLight ?? "about-section-image__overlay--light"
    : overlayClassName;

  return (
    <>
      <Image
        src={src}
        alt={imageAlt}
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 50vw"
      />
      {overlay ? (
        <div
          className={cn("pointer-events-none absolute inset-0", overlay)}
          aria-hidden
        />
      ) : null}
    </>
  );
}
