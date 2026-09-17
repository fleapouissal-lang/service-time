"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  loadingLabel: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function AdminConfirmDialog({
  open,
  title,
  message,
  cancelLabel,
  confirmLabel,
  loadingLabel,
  pending = false,
  onCancel,
  onConfirm,
}: AdminConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-confirm-dialog-title"
      onClick={() => !pending && onCancel()}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        aria-busy={pending}
      >
        {pending ? (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-card/85 backdrop-blur-[1px]"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-8 animate-spin text-red-500" aria-hidden />
            <p className="text-sm font-semibold text-foreground">{loadingLabel}</p>
          </div>
        ) : null}
        <h2 id="admin-confirm-dialog-title" className="text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="default"
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {loadingLabel}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
