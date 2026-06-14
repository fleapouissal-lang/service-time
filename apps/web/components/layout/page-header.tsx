import { cn } from "@/lib/utils";
import {
  sectionEyebrowClass,
  sectionTitleH1Class,
} from "@/lib/section-styles";

const PLAIN_WIDTH = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-[1200px]",
} as const;

export function PageHeader({
  eyebrow,
  title,
  description,
  plain = false,
  plainWidth = "xl",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  plain?: boolean;
  plainWidth?: keyof typeof PLAIN_WIDTH;
}) {
  return (
    <section
      className={cn(
        plain
          ? cn(
              "mx-auto w-[90%] pt-28 pb-8 sm:pt-32",
              PLAIN_WIDTH[plainWidth],
            )
          : "border-b border-border bg-[#060709]",
      )}
    >
      <div
        className={cn(
          plain ? "text-start" : "mx-auto max-w-6xl px-4 py-12 sm:px-6",
        )}
      >
        {eyebrow && (
          <p className={sectionEyebrowClass}>{eyebrow}</p>
        )}
        <h1 className={sectionTitleH1Class}>{title}</h1>
        {description && (
          <p className="mt-3 max-w-3xl text-base leading-8 text-muted">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
