"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SparePartMediaImage } from "@/components/spare-parts/spare-part-media-image";
import { iconAccentClass } from "@/lib/card-surface";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type SparePartImageSliderProps = {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  overlay?: React.ReactNode;
};

export function SparePartImageSlider({
  images,
  alt,
  className,
  imageClassName,
  sizes = "512px",
  overlay,
}: SparePartImageSliderProps) {
  const { messages: t } = useLocale();
  const [index, setIndex] = useState(0);
  const count = images.length;
  const hasMultiple = count > 1;

  useEffect(() => {
    setIndex(0);
  }, [images]);

  const goPrev = useCallback(() => {
    setIndex((current) => (current <= 0 ? count - 1 : current - 1));
  }, [count]);

  const goNext = useCallback(() => {
    setIndex((current) => (current >= count - 1 ? 0 : current + 1));
  }, [count]);

  if (!count) return null;

  return (
    <div className={cn("relative aspect-[4/3] w-full overflow-hidden bg-[#060709]", className)}>
      <SparePartMediaImage
        key={images[index]}
        src={images[index]}
        alt={hasMultiple ? `${alt} (${index + 1}/${count})` : alt}
        fill
        className={cn("object-cover", imageClassName)}
        sizes={sizes}
      />

      {overlay}

      {hasMultiple ? (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              goPrev();
            }}
            className={cn(
              "absolute top-1/2 right-3 z-30 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--icon-accent)_35%,transparent)] bg-[#050B10]/85 transition-colors hover:bg-[var(--icon-accent-bg)]",
              iconAccentClass,
            )}
            aria-label={t.spareParts.photoPrev}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              goNext();
            }}
            className={cn(
              "absolute top-1/2 left-3 z-30 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--icon-accent)_35%,transparent)] bg-[#050B10]/85 transition-colors hover:bg-[var(--icon-accent-bg)]",
              iconAccentClass,
            )}
            aria-label={t.spareParts.photoNext}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>

          <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#94D4B9]/25 bg-[#050B10]/80 px-3 py-1.5">
            {images.map((url, dotIndex) => (
              <button
                key={url}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIndex(dotIndex);
                }}
                className={cn(
                  "size-2 rounded-full transition-all",
                  dotIndex === index
                    ? "scale-110 bg-[#94D4B9]"
                    : "bg-[#94D4B9]/35 hover:bg-[#94D4B9]/60",
                )}
                aria-label={t.spareParts.photoGoTo.replace(
                  "{n}",
                  String(dotIndex + 1),
                )}
              />
            ))}
          </div>

          <span className="absolute top-3 left-3 z-30 rounded-full border border-[#94D4B9]/25 bg-[#050B10]/80 px-2.5 py-1 text-xs font-semibold text-[#94D4B9]">
            {t.spareParts.photoCounter
              .replace("{current}", String(index + 1))
              .replace("{total}", String(count))}
          </span>
        </>
      ) : null}
    </div>
  );
}
