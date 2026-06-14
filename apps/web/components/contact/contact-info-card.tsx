import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  surfaceCardIconClass,
  surfaceCardIconWrapClass,
  surfaceCardInteractiveClass,
} from "@/lib/card-surface";

type ContactInfoCardProps = {
  href: string;
  icon: LucideIcon;
  title: string;
  value: string;
  external?: boolean;
  valueDir?: "ltr" | "rtl";
  className?: string;
};

export function ContactInfoCard({
  href,
  icon: Icon,
  title,
  value,
  external = false,
  valueDir,
  className,
}: ContactInfoCardProps) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "flex items-start gap-4 p-6 hover:-translate-y-0.5",
        surfaceCardInteractiveClass,
        className,
      )}
    >
      <span className={cn("size-10 rounded-lg", surfaceCardIconWrapClass)}>
        <Icon className={cn("size-5", surfaceCardIconClass)} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 text-start">
        <p className="font-semibold text-card-foreground">{title}</p>
        <p className="mt-1 text-start text-sm leading-7 text-muted">
          {valueDir ? (
            <span dir={valueDir} className="inline-block max-w-full">
              {value}
            </span>
          ) : (
            value
          )}
        </p>
      </div>
    </a>
  );
}
