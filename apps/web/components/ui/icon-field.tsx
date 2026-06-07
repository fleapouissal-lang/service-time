"use client";

import { type LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const fieldShellClass =
  "flex w-full items-center gap-3 rounded-xl border border-[#94D4B9]/15 bg-[#091014] px-3 transition-all duration-200 hover:border-[#94D4B9]/30 focus-within:border-[#94D4B9]/40 focus-within:ring-2 focus-within:ring-[#94D4B9]/25";

function FieldIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#94D4B9]/10">
      <Icon className="size-4 text-[#94D4B9]" aria-hidden />
    </span>
  );
}

export type IconInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon: LucideIcon;
};

export const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  ({ icon, className, ...props }, ref) => (
    <div className={cn(fieldShellClass, "h-11")}>
      <FieldIcon icon={icon} />
      <input
        ref={ref}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  ),
);
IconInput.displayName = "IconInput";

export type IconTextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    icon: LucideIcon;
  };

export const IconTextarea = React.forwardRef<
  HTMLTextAreaElement,
  IconTextareaProps
>(({ icon, className, ...props }, ref) => (
  <div className={cn(fieldShellClass, "items-start py-3")}>
    <FieldIcon icon={icon} />
    <textarea
      ref={ref}
      className={cn(
        "min-h-[96px] min-w-0 flex-1 resize-y bg-transparent py-0.5 text-sm text-foreground placeholder:text-muted focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
));
IconTextarea.displayName = "IconTextarea";
