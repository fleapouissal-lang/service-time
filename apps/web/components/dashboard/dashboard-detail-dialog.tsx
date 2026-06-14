"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DashboardDetailField = {
  label: string;
  value: ReactNode;
  ltr?: boolean;
  fullWidth?: boolean;
};

type DashboardDetailDialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  closeLabel: string;
  fields?: DashboardDetailField[];
  children?: ReactNode;
};

export function DashboardDetailDialog({
  open,
  title,
  onClose,
  closeLabel,
  fields = [],
  children,
}: DashboardDetailDialogProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-detail-dialog-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
          <h2
            id="dashboard-detail-dialog-title"
            className="text-lg font-semibold leading-snug"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
            aria-label={closeLabel}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          {fields.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((field, index) => (
                <div
                  key={`${field.label}-${index}`}
                  className={cn(
                    "rounded-xl border border-border p-3",
                    field.fullWidth && "sm:col-span-2",
                  )}
                >
                  <p className="text-xs font-medium text-muted">{field.label}</p>
                  <div
                    className={cn(
                      "mt-1 text-sm",
                      field.ltr && "ltr:text-left rtl:text-left",
                    )}
                    dir={field.ltr ? "ltr" : undefined}
                  >
                    {field.value}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {children}
        </div>

        <div className="flex justify-end border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {closeLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
