import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
        "flex items-start gap-4 rounded-[20px] border border-[#94D4B9]/10 bg-[#091014] p-6",
        "shadow-[0_4px_24px_rgba(148,212,185,0.06)] transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-[#94D4B9]/30 hover:shadow-[0_12px_40px_rgba(148,212,185,0.18)]",
        className,
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#94D4B9]/10">
        <Icon className="size-5 text-[#94D4B9]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 text-start">
        <p className="font-semibold text-white">{title}</p>
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
