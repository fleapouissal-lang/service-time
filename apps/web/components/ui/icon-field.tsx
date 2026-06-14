"use client";

import { type LucideIcon } from "lucide-react";
import * as React from "react";
import { iconAccentBgClass, iconAccentClass } from "@/lib/card-surface";
import { requestFieldShellClass } from "@/lib/request-styles";
import { cn } from "@/lib/utils";

const fieldShellClass = cn(
  "flex w-full items-center gap-3 rounded-xl px-3 transition-all duration-200",
  requestFieldShellClass,
);

function FieldIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", iconAccentBgClass)}>
      <Icon className={cn("size-4", iconAccentClass)} aria-hidden />
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
