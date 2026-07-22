"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Car, Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import type { ClientVehicle } from "@service-time/types";
import { AddVehicleModal } from "@/components/client/vehicles/add-vehicle-modal";
import { VehicleBrandLogo } from "@/components/client/vehicles/vehicle-brand-logo";
import { Label } from "@/components/ui/label";
import {
  getVehicleBrandLogo,
  getVehicleDisplayName,
} from "@/lib/client-vehicle-display";
import { iconAccentBgClass, iconAccentClass } from "@/lib/card-surface";
import { requestFieldShellClass } from "@/lib/request-styles";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type ClientVehicleFieldProps = {
  vehicles: ClientVehicle[];
  variant?: "request" | "dashboard";
  clientId?: string;
  allowDelete?: boolean;
  className?: string;
};

export function ClientVehicleField({
  vehicles: vehiclesProp,
  variant = "request",
  clientId,
  allowDelete = true,
  className,
}: ClientVehicleFieldProps) {
  const { messages: t, locale } = useLocale();
  const f = t.request.form;
  const pathname = usePathname();
  const [vehicles, setVehicles] = useState(vehiclesProp);
  const [selection, setSelection] = useState("");
  const [open, setOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [modalSession, setModalSession] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const addVehicleHref = `/client/vehicles?next=${encodeURIComponent(pathname)}`;
  const useModal = variant === "request" && !clientId;

  useEffect(() => {
    setVehicles(vehiclesProp);
  }, [vehiclesProp]);

  useEffect(() => {
    setSelection((current) => {
      if (current && vehicles.some((vehicle) => vehicle.label === current)) {
        return current;
      }
      return vehicles[0]?.label ?? "";
    });
    setDeleteError("");
  }, [vehicles]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.label === selection),
    [vehicles, selection],
  );

  function handleVehicleAdded(vehicle: ClientVehicle) {
    setVehicles((current) => {
      const exists = current.some((item) => item.id === vehicle.id);
      if (exists) {
        return current.map((item) => (item.id === vehicle.id ? vehicle : item));
      }
      return [vehicle, ...current];
    });
    setSelection(vehicle.label);
  }

  function openAddModal() {
    setOpen(false);
    setModalSession((value) => value + 1);
    setAddModalOpen(true);
  }

  async function handleDeleteVehicle(vehicle: ClientVehicle) {
    if (!allowDelete || deletingId) return;

    const displayName = getVehicleDisplayName(vehicle, locale);
    const confirmed = window.confirm(
      f.deleteVehicleConfirm.replace("{vehicle}", displayName),
    );
    if (!confirmed) return;

    setDeletingId(vehicle.id);
    setDeleteError("");

    try {
      const res = await fetch("/api/client-vehicles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: vehicle.id,
          label: vehicle.label,
          ...(clientId ? { clientId } : {}),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        vehicles?: ClientVehicle[];
      };

      if (!res.ok) {
        setDeleteError(data.error ?? f.deleteVehicleFailed);
        return;
      }

      setVehicles(data.vehicles ?? []);
    } catch {
      setDeleteError(f.deleteVehicleFailed);
    } finally {
      setDeletingId(null);
    }
  }

  const selectedName = selectedVehicle
    ? getVehicleDisplayName(selectedVehicle, locale)
    : "";
  const selectedLogo = selectedVehicle
    ? getVehicleBrandLogo(selectedVehicle)
    : null;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="car_type_select">{f.selectCar}</Label>

      <input type="hidden" name="car_type" value={selection} required />

      <div ref={containerRef} className={cn("relative", open && "z-[1000]")}>
        <button
          type="button"
          id="car_type_select"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-foreground transition-all duration-200",
            requestFieldShellClass,
            "focus-visible:outline-none",
            open &&
              "border-[color:var(--request-field-focus-border)] shadow-[0_0_0_2px_var(--request-field-focus-ring)]",
          )}
        >
          {selectedVehicle ? (
            <VehicleBrandLogo src={selectedLogo} alt={selectedName} size="sm" />
          ) : (
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                iconAccentBgClass,
              )}
            >
              <Car className={cn("size-4", iconAccentClass)} aria-hidden />
            </span>
          )}
          <span className="flex-1 truncate text-start">
            {selectedName || f.selectCar}
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted transition-transform duration-200",
              open && cn("rotate-180", iconAccentClass),
            )}
            aria-hidden
          />
        </button>

        {open ? (
          <ul
            role="listbox"
            aria-labelledby="car_type_select"
            className={cn(
              "scrollbar-theme absolute z-[1000] mt-1.5 max-h-64 w-full overflow-y-auto",
              "rounded-2xl border border-[color:var(--request-select-dropdown-border)]",
              "bg-[color:var(--request-select-dropdown-bg)] p-1.5",
              "shadow-[var(--request-select-dropdown-shadow)]",
              "ring-1 ring-black/5 dark:ring-white/5",
            )}
          >
            {vehicles.map((vehicle) => {
              const isSelected = vehicle.label === selection;
              const name = getVehicleDisplayName(vehicle, locale);
              const logo = getVehicleBrandLogo(vehicle);
              const isDeleting = deletingId === vehicle.id;

              return (
                <li key={vehicle.id} role="option" aria-selected={isSelected}>
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors",
                      isSelected
                        ? "bg-[color:var(--request-select-option-selected-bg)]"
                        : "hover:bg-[color:var(--request-select-option-hover-bg)]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelection(vehicle.label);
                        setOpen(false);
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-start"
                    >
                      <VehicleBrandLogo src={logo} alt={name} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {name}
                      </span>
                      {isSelected ? (
                        <Check
                          className={cn("size-4 shrink-0", iconAccentClass)}
                          aria-hidden
                        />
                      ) : null}
                    </button>

                    {allowDelete ? (
                      <button
                        type="button"
                        onClick={() => void handleDeleteVehicle(vehicle)}
                        disabled={isDeleting}
                        aria-label={f.deleteVehicle}
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-500/15 disabled:opacity-50"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}

            {vehicles.length > 0 ? (
              <li className="my-1 border-t border-border/60" aria-hidden />
            ) : null}

            <li>
              {useModal ? (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-start text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      iconAccentBgClass,
                    )}
                  >
                    <Plus className={cn("size-4", iconAccentClass)} aria-hidden />
                  </span>
                  {f.newCar}
                </button>
              ) : (
                <Link
                  href={addVehicleHref}
                  className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-start text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      iconAccentBgClass,
                    )}
                  >
                    <Plus className={cn("size-4", iconAccentClass)} aria-hidden />
                  </span>
                  {f.newCar}
                </Link>
              )}
            </li>
          </ul>
        ) : null}
      </div>

      {vehicles.length === 0 ? (
        <p className="text-xs text-muted">{f.newCarHint}</p>
      ) : (
        <p className="text-xs text-muted">{f.savedCarHint}</p>
      )}

      {deleteError ? (
        <p className="text-xs text-red-400">{deleteError}</p>
      ) : null}

      {useModal ? (
        <AddVehicleModal
          key={modalSession}
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={handleVehicleAdded}
        />
      ) : null}
    </div>
  );
}
