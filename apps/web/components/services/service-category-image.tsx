import Image from "next/image";
import { getServiceCatalogImage } from "@/lib/services-catalog-images";
import { cn } from "@/lib/utils";

type ServiceCategoryImageProps = {
  categoryId: string;
  alt: string;
  variant?: "card" | "banner" | "thumb";
  priority?: boolean;
};

const catalogImageProps = {
  unoptimized: true,
} as const;

export function ServiceCategoryImage({
  categoryId,
  alt,
  variant = "card",
  priority = false,
}: ServiceCategoryImageProps) {
  const src = getServiceCatalogImage(categoryId);

  if (variant === "thumb") {
    return (
      <div className="relative size-16 shrink-0 overflow-hidden rounded-xl sm:size-20">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="80px"
          className="object-cover object-center"
          priority={priority}
          {...catalogImageProps}
        />
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className="relative aspect-[2.2/1] w-full shrink-0 overflow-hidden sm:aspect-[2.4/1]">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 672px"
          className="object-cover object-center"
          priority={priority}
          {...catalogImageProps}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full shrink-0 overflow-hidden bg-[#050b10]",
        "aspect-[16/10] sm:aspect-[5/3]",
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
        priority={priority}
        {...catalogImageProps}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
    </div>
  );
}
