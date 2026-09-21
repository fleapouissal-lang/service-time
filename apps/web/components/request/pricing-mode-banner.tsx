"use client";

import { Banknote, ClipboardList, Wrench } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import type { ServicePricingMode } from "@/lib/service-pricing-mode";
import { cn } from "@/lib/utils";

type PricingModeBannerProps = {
  mode: ServicePricingMode;
  className?: string;
  /** Compact badge only (no steps). */
  compact?: boolean;
};

export function PricingModeBadge({
  mode,
  className,
}: {
  mode: ServicePricingMode;
  className?: string;
}) {
  const { messages: t } = useLocale();
  const copy = t.request.pricingMode;
  const label =
    mode === "ops_quote"
      ? copy.badgeOps
      : mode === "editable"
        ? copy.badgeEditable
        : mode === "branch_no_price"
          ? copy.badgeBranch
          : copy.badgeFixed;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        mode === "ops_quote"
          ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
          : mode === "editable"
            ? "bg-sky-500/15 text-sky-800 dark:text-sky-200"
            : "bg-[#94D4B9]/20 text-[#0f5132]",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function PricingModeBanner({
  mode,
  className,
  compact = false,
}: PricingModeBannerProps) {
  const { messages: t } = useLocale();
  const copy = t.request.pricingMode;

  const title =
    mode === "ops_quote"
      ? copy.opsTitle
      : mode === "editable"
        ? copy.editableTitle
        : mode === "branch_no_price"
          ? copy.branchTitle
          : copy.fixedTitle;

  const hint =
    mode === "ops_quote"
      ? copy.opsHint
      : mode === "editable"
        ? copy.editableHint
        : mode === "branch_no_price"
          ? copy.branchHint
          : copy.fixedHint;

  const Icon =
    mode === "ops_quote"
      ? ClipboardList
      : mode === "editable"
        ? Wrench
        : Banknote;

  if (compact) {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <PricingModeBadge mode={mode} />
        <p className="text-xs leading-5 text-muted">{hint}</p>
      </div>
    );
  }

  const steps =
    mode === "ops_quote"
      ? copy.opsSteps
      : mode === "editable" || mode === "fixed"
        ? copy.fixedSteps
        : copy.branchSteps;

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        mode === "ops_quote"
          ? "border-amber-500/30 bg-amber-500/10"
          : "border-[#94D4B9]/25 bg-[#94D4B9]/10",
        className,
      )}
      role="note"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
            mode === "ops_quote" ? "bg-amber-500/15" : "bg-[#94D4B9]/20",
          )}
        >
          <Icon
            className={cn(
              "size-4",
              mode === "ops_quote" ? "text-amber-800" : "text-[#0f5132]",
            )}
            aria-hidden
          />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{title}</p>
            <PricingModeBadge mode={mode} />
          </div>
          <p className="text-sm leading-7 text-foreground/90">{hint}</p>
          <ol className="space-y-1 text-xs leading-6 text-muted">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-2">
                <span className="tabular-nums font-semibold text-foreground/70">
                  {index + 1}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
