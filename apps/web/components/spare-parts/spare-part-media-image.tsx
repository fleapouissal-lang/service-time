import Image from "next/image";
import { cn } from "@/lib/utils";

/** Bump when replacing files under public/spare-parts/ to bust browser cache. */
export const SPARE_PART_STATIC_IMAGE_VERSION = "3";

export function withSparePartImageVersion(src: string): string {
  if (!src.startsWith("/spare-parts/")) return src;
  if (src.includes("?")) return src;
  return `${src}?v=${SPARE_PART_STATIC_IMAGE_VERSION}`;
}

function isLocalSparePartAsset(src: string): boolean {
  return src.startsWith("/spare-parts/");
}

type SparePartMediaImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
};

export function SparePartMediaImage({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 50vw, 33vw",
  fill = false,
  width,
  height,
  priority = false,
}: SparePartMediaImageProps) {
  const resolvedSrc = withSparePartImageVersion(src);
  const unoptimized = isLocalSparePartAsset(src);

  if (fill) {
    return (
      <Image
        src={resolvedSrc}
        alt={alt}
        fill
        unoptimized={unoptimized}
        priority={priority}
        className={cn(className)}
        sizes={sizes}
      />
    );
  }

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={width ?? 96}
      height={height ?? 96}
      unoptimized={unoptimized}
      priority={priority}
      className={cn(className)}
    />
  );
}
