"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ClientVehicle } from "@service-time/types";
import { AddVehicleForm } from "@/components/client/vehicles/add-vehicle-form";
import { useLocale } from "@/lib/i18n/locale-context";

type AddVehicleModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (vehicle: ClientVehicle) => void;
};

export function AddVehicleModal({ open, onClose, onSuccess }: AddVehicleModalProps) {
  const { messages: t } = useLocale();
  const v = t.clientVehicles;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!open || !mounted) return null;

  function handleSuccess(vehicle: ClientVehicle) {
    onSuccess(vehicle);
    onClose();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-vehicle-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-label={t.common.close}
        onClick={onClose}
      />

      <div className="add-vehicle-modal__panel relative z-[1] flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[20px] border border-border shadow-2xl sm:rounded-[20px]">
        <div className="add-vehicle-modal__header flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3 sm:px-5">
          <h2 id="add-vehicle-modal-title" className="text-lg font-bold">
            {v.addTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:bg-primary/5 hover:text-foreground"
            aria-label={t.common.close}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="scrollbar-theme overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <AddVehicleForm variant="modal" stayOnPage onSuccess={handleSuccess} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
