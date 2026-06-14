import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  sectionEyebrowClass,
  sectionTitleH2MdClass,
} from "@/lib/section-styles";

type AboutImageTextSectionProps = {
  eyebrow: string;
  title: string;
  highlight?: string;
  description: string;
  paragraphs?: string[];
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
  overlayClassName?: string;
};

export function AboutImageTextSection({
  eyebrow,
  title,
  highlight,
  description,
  paragraphs = [],
  imageSrc,
  imageAlt,
  reverse = false,
  overlayClassName = "bg-black/55",
}: AboutImageTextSectionProps) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
      <div
        className={cn(
          "relative min-h-[300px] overflow-hidden rounded-[20px] border border-[#94D4B9]/10 sm:min-h-[380px] lg:min-h-[440px]",
          reverse ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-2 lg:row-start-1",
        )}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <div
          className={cn("pointer-events-none absolute inset-0", overlayClassName)}
          aria-hidden
        />
      </div>

      <div
        className={cn(
          "flex flex-col justify-center gap-4 text-start",
          reverse ? "lg:col-start-2 lg:row-start-1" : "lg:col-start-1 lg:row-start-1",
        )}
      >
        <p className={sectionEyebrowClass}>{eyebrow}</p>
        <h2 className={sectionTitleH2MdClass}>
          {title}{" "}
          {highlight ? (
            <span className="text-[var(--section-eyebrow)]">{highlight}</span>
          ) : null}
        </h2>
        <div className="space-y-3">
          <p className="text-base leading-8 text-muted">{description}</p>
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-base leading-8 text-muted">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
