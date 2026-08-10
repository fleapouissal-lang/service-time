"use client";

import { FormEvent, useState, useTransition } from "react";
import { Link2, Loader2, MapPin, Trash2 } from "lucide-react";
import {
  deleteWorkshopLocationAction,
  saveWorkshopLocationAction,
} from "@/app/admin/actions";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { StaticPinMap } from "@/components/maps/static-pin-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  geocodeWorkshopAddress,
  resolveWorkshopLocationPaste,
} from "@/lib/geocode-address";
import type { WorkshopBranch } from "@/lib/localized-content";
import { getWorkshopName } from "@/lib/localized-content";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type AdminWorkshopFormProps = {
  branch?: WorkshopBranch;
  canDelete?: boolean;
  className?: string;
  embedded?: boolean;
  onSaved?: () => void;
};

export function AdminWorkshopForm({
  branch,
  canDelete = false,
  className,
  embedded = false,
  onSaved,
}: AdminWorkshopFormProps) {
  const { messages: t, locale } = useLocale();
  const p = t.dashboard.admin.locationsPage;
  const isEdit = Boolean(branch);
  const [nameAr, setNameAr] = useState(branch?.name_ar ?? "");
  const [nameEn, setNameEn] = useState(branch?.name_en ?? "");
  const [addressAr, setAddressAr] = useState(branch?.address_ar ?? "");
  const [addressEn, setAddressEn] = useState(branch?.address_en ?? "");
  const [lat, setLat] = useState(
    branch?.lat != null ? String(branch.lat) : "",
  );
  const [lng, setLng] = useState(
    branch?.lng != null ? String(branch.lng) : "",
  );
  const [pasteValue, setPasteValue] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  const latNum = Number(lat);
  const lngNum = Number(lng);
  const hasCoords =
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180;

  function applyResolvedLocation(
    coords: { lat: number; lng: number },
    resolvedAddress?: string,
    sourcePaste?: string,
  ) {
    setLat(String(coords.lat));
    setLng(String(coords.lng));

    if (resolvedAddress) {
      if (!addressAr.trim()) setAddressAr(resolvedAddress);
      if (!addressEn.trim()) setAddressEn(resolvedAddress);
    } else if (sourcePaste && !addressAr.trim()) {
      setAddressAr(sourcePaste.trim());
    }
  }

  async function handleApplyPaste() {
    setError("");
    setInfo("");

    const trimmed = pasteValue.trim();
    if (!trimmed) {
      setError(p.pasteRequired);
      return;
    }

    setGeocoding(true);
    try {
      const result = await resolveWorkshopLocationPaste(trimmed);
      if (!result) {
        setError(p.pasteFailed);
        return;
      }
      applyResolvedLocation(
        result.coords,
        result.resolvedAddress,
        trimmed,
      );
      setInfo(
        result.resolvedAddress
          ? `${p.pasteSuccess} (${result.resolvedAddress})`
          : p.pasteSuccess,
      );
    } catch {
      setError(p.pasteFailed);
    } finally {
      setGeocoding(false);
    }
  }

  async function handleGeocode() {
    setError("");
    setInfo("");

    if (!addressAr.trim() && !addressEn.trim()) {
      setError(p.addressArRequired);
      return;
    }

    setGeocoding(true);
    try {
      const result = await geocodeWorkshopAddress(addressAr, addressEn);
      if (!result) {
        setError(p.geocodeFailed);
        return;
      }
      setLat(String(result.coords.lat));
      setLng(String(result.coords.lng));
      setInfo(
        result.resolvedAddress
          ? `${p.geocodeSuccess} (${result.resolvedAddress})`
          : p.geocodeSuccess,
      );
    } catch {
      setError(p.geocodeFailed);
    } finally {
      setGeocoding(false);
    }
  }

  function buildFormData(): FormData {
    const formData = new FormData();
    if (branch?.id) {
      formData.set("id", branch.id);
    }
    formData.set("name_ar", nameAr);
    formData.set("name_en", nameEn);
    formData.set("address_ar", addressAr);
    formData.set("address_en", addressEn);
    formData.set("lat", lat);
    formData.set("lng", lng);
    return formData;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!hasCoords) {
      setError(p.coordsInvalid);
      return;
    }

    startTransition(async () => {
      try {
        await saveWorkshopLocationAction(buildFormData());
        setInfo(p.saved);
        if (!isEdit) {
          setNameAr("");
          setNameEn("");
          setAddressAr("");
          setAddressEn("");
          setLat("");
          setLng("");
          setPasteValue("");
        }
        onSaved?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : p.saveFailed);
      }
    });
  }

  function handleDelete() {
    if (!branch) return;
    startDeleteTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", branch.id);
        await deleteWorkshopLocationAction(formData);
        setDeleteOpen(false);
        onSaved?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : p.deleteFailed);
        setDeleteOpen(false);
      }
    });
  }

  const displayName = branch
    ? getWorkshopName(branch, locale)
    : p.newWorkshop;

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "rounded-2xl border border-border bg-card p-5 sm:p-6",
          className,
        )}
      >
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {!embedded || isEdit ? (
              <p className="text-sm font-semibold text-primary">
                {isEdit ? p.editWorkshop : p.addWorkshop}
              </p>
            ) : null}
            {isEdit ? (
              <h3 className="mt-1 text-lg font-bold">{displayName}</h3>
            ) : null}
          </div>
          {isEdit && canDelete ? (
            <Button
              type="button"
              variant="outline"
              className="border-red-400/40 text-red-400 hover:bg-red-950/30"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" aria-hidden />
              {t.common.delete}
            </Button>
          ) : null}
          {isEdit && !canDelete ? (
            <p className="text-xs text-muted">{p.minOneHint}</p>
          ) : null}
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {info ? (
          <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            {info}
          </div>
        ) : null}

        <div className="mb-5 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
          <Label htmlFor={`paste_maps_${branch?.id ?? "new"}`}>
            {p.pasteMapsLabel}
          </Label>
          <p className="mt-1 text-xs leading-5 text-muted">{p.pasteMapsHint}</p>
          <Textarea
            id={`paste_maps_${branch?.id ?? "new"}`}
            value={pasteValue}
            onChange={(event) => setPasteValue(event.target.value)}
            placeholder={p.pasteMapsPlaceholder}
            className="mt-3 min-h-[5.5rem] resize-y"
            dir="auto"
          />
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => void handleApplyPaste()}
            disabled={geocoding || pending}
          >
            {geocoding ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Link2 className="size-4" aria-hidden />
            )}
            {geocoding ? p.applyingPaste : p.applyPaste}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor={`name_ar_${branch?.id ?? "new"}`}>{p.nameAr}</Label>
            <Input
              id={`name_ar_${branch?.id ?? "new"}`}
              value={nameAr}
              onChange={(event) => setNameAr(event.target.value)}
              required
              className="mt-1"
              dir="rtl"
            />
          </div>
          <div>
            <Label htmlFor={`name_en_${branch?.id ?? "new"}`}>{p.nameEn}</Label>
            <Input
              id={`name_en_${branch?.id ?? "new"}`}
              value={nameEn}
              onChange={(event) => setNameEn(event.target.value)}
              className="mt-1"
              dir="ltr"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor={`address_ar_${branch?.id ?? "new"}`}>
              {p.addressAr}
            </Label>
            <Textarea
              id={`address_ar_${branch?.id ?? "new"}`}
              value={addressAr}
              onChange={(event) => setAddressAr(event.target.value)}
              required
              className="mt-1 min-h-[4.5rem] resize-y"
              dir="rtl"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor={`address_en_${branch?.id ?? "new"}`}>
              {p.addressEn}
            </Label>
            <Textarea
              id={`address_en_${branch?.id ?? "new"}`}
              value={addressEn}
              onChange={(event) => setAddressEn(event.target.value)}
              className="mt-1 min-h-[4.5rem] resize-y"
              dir="ltr"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleGeocode()}
            disabled={geocoding || pending}
          >
            {geocoding ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <MapPin className="size-4" aria-hidden />
            )}
            {geocoding ? p.geocoding : p.geocode}
          </Button>
          <Button type="submit" disabled={pending || geocoding}>
            {pending ? t.common.saving : isEdit ? p.saveChanges : p.addWorkshop}
          </Button>
        </div>

        {hasCoords ? (
          <div className="mt-5 overflow-hidden rounded-xl border border-border">
            <StaticPinMap
              lat={latNum}
              lng={lngNum}
              query={addressAr.trim() || addressEn.trim() || undefined}
            />
          </div>
        ) : null}
      </form>

      <AdminConfirmDialog
        open={deleteOpen}
        title={p.deleteConfirmTitle}
        message={p.deleteConfirmMessage.replace("{name}", displayName)}
        cancelLabel={t.common.cancel}
        confirmLabel={t.common.delete}
        loadingLabel={t.common.loading}
        pending={deletePending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
